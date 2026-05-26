import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Send, Loader2, MicOff, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@/lib/chat-context";
import { getSupportedMimeType, buildAudioFile, watchMicDevices } from "@/lib/audio-utils";

const MAX_RECORDING_SECONDS = 120; // 2-minute hard cap

function formatTime(s: number) {
  const m   = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function ChatInput() {
  const [message, setMessage]                   = useState("");
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [isRecording, setIsRecording]           = useState(false);
  const [recordingTime, setRecordingTime]       = useState(0);
  const [permissionError, setPermissionError]   = useState<string | null>(null);
  const [isUploading, setIsUploading]           = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const mountedRef       = useRef(true);

  const { sendMessage, sendAudio, isSending } = useChat();

  /* ── Lifecycle ──────────────────────────────────────────────────── */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
      stopStream();
    };
  }, []);

  // Stop recording if the mic device changes while recording
  useEffect(() => {
    return watchMicDevices(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        cancelRecording(); // discard partial audio; user must re-record on new device
      }
    });
  });

  /* ── Helpers ────────────────────────────────────────────────────── */

  const clearTimers = () => {
    if (timerRef.current)    { clearInterval(timerRef.current);   timerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  /** Cancel recording without uploading (too short, device change, dialog close). */
  const cancelRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== "recording") return;
    mr.ondataavailable = null;
    mr.onstop = () => stopStream();
    mr.stop();
    clearTimers();
    if (mountedRef.current) {
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, []);

  /* ── Send text ──────────────────────────────────────────────────── */

  const handleSend = async () => {
    if (message.trim() && !isSending) {
      const text = message.trim();
      setMessage("");
      await sendMessage(text);
    }
  };

  // Allow other components to trigger voice recording via custom event
  useEffect(() => {
    const handleStartVoice = () => {
      setIsVoiceDialogOpen(true);
      setTimeout(() => handleStartRecording(), 100);
    };
    window.addEventListener("mindcare-start-voice", handleStartVoice);
    return () => window.removeEventListener("mindcare-start-voice", handleStartVoice);
  }, []);

  /* ── Recording ──────────────────────────────────────────────────── */

  const handleStartRecording = async () => {
    if (mountedRef.current) setPermissionError(null);
    chunksRef.current = [];

    // 1. Acquire mic stream
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionError("Izin mikrofon ditolak. Izinkan akses mikrofon di browser Anda lalu coba lagi.");
      } else {
        setPermissionError("Mikrofon tidak tersedia atau tidak didukung browser ini.");
      }
      return;
    }
    streamRef.current = stream;

    // 2. Create recorder (guard constructor failure so stream is always cleaned up)
    let mediaRecorder: MediaRecorder;
    try {
      const mimeType = getSupportedMimeType();
      mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      stopStream();
      if (mountedRef.current) setPermissionError("MediaRecorder tidak didukung browser ini.");
      return;
    }
    mediaRecorderRef.current = mediaRecorder;

    // 3. Wire up events
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onerror = () => {
      clearTimers();
      stopStream();
      if (mountedRef.current) {
        setIsRecording(false);
        setRecordingTime(0);
        setPermissionError("Terjadi kesalahan perekaman. Coba lagi.");
      }
    };

    mediaRecorder.onstop = async () => {
      clearTimers();
      stopStream();

      const file = buildAudioFile(chunksRef.current, mediaRecorder.mimeType);

      if (mountedRef.current) {
        setIsRecording(false);
        setRecordingTime(0);
        setIsUploading(true);
        setIsVoiceDialogOpen(false);
      }

      try {
        await sendAudio(file);
      } finally {
        if (mountedRef.current) setIsUploading(false);
      }
    };

    // 4. Start
    mediaRecorder.start(100); // 100 ms timeslice — continuous chunks, more reliable

    if (mountedRef.current) {
      setIsRecording(true);
      setRecordingTime(0);
    }

    timerRef.current = setInterval(() => {
      if (mountedRef.current) setRecordingTime((t) => t + 1);
    }, 1000);

    // Hard cap: auto-stop at MAX_RECORDING_SECONDS
    maxTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    }, MAX_RECORDING_SECONDS * 1000);
  };

  const handleStopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== "recording") return;

    if (recordingTime < 1) {
      cancelRecording(); // too short — discard silently
      return;
    }

    mr.stop(); // triggers onstop → upload
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && isRecording) cancelRecording(); // closing while recording — discard
    if (!open && mountedRef.current) setPermissionError(null);
    if (mountedRef.current) setIsVoiceDialogOpen(open);
  };

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div className="border-t border-border bg-card p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bagikan perasaan Anda di sini... Kami mendengarkan dengan empati."
            className="resize-none min-h-[100px] border border-border rounded-lg pl-4 pr-[88px] py-3 font-sans text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={isSending}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSend(); }}
          />

          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Button
              onClick={() => setIsVoiceDialogOpen(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-accent hover:bg-secondary"
              title="Rekam suara (Beta)"
              disabled={isSending || isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              size="icon"
              className="h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
              title="Kirim pesan"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Ctrl + Enter untuk kirim • Pikiran Anda aman dan rahasia
        </p>
      </div>

      {/* Voice Recording Dialog */}
      <Dialog open={isVoiceDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Rekam Suara</DialogTitle>
            <DialogDescription>
              Klik tombol di bawah untuk mulai merekam suara Anda. Kami akan mentranskrip secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-5 py-4">

            {permissionError && (
              <div className="flex items-start gap-2 w-full rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive leading-relaxed">{permissionError}</p>
              </div>
            )}

            {isRecording ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute w-14 h-14 rounded-full bg-red-500/30 animate-pulse" />
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-mono font-bold text-red-500 tabular-nums">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Merekam... tekan Stop untuk selesai
                  {recordingTime >= MAX_RECORDING_SECONDS - 10 && (
                    <span className="text-orange-500 ml-1">(maks {MAX_RECORDING_SECONDS}d)</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {permissionError ? "Perbaiki izin mikrofon lalu coba lagi" : "Siap merekam"}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              {isRecording ? (
                <Button
                  onClick={handleStopRecording}
                  className="w-full bg-red-500 hover:bg-red-600 text-white gap-2"
                  size="lg"
                >
                  <MicOff className="h-4 w-4" />
                  Stop Rekaman
                </Button>
              ) : (
                <Button
                  onClick={handleStartRecording}
                  className="w-full bg-primary hover:bg-primary/90 gap-2"
                  size="lg"
                  disabled={!!permissionError}
                >
                  <Mic className="h-4 w-4" />
                  Mulai Rekam
                </Button>
              )}

              <Button
                onClick={() => handleDialogClose(false)}
                variant="outline"
                className="w-full"
                disabled={isRecording}
              >
                Tutup
              </Button>
            </div>

            {recordingTime > 0 && !isRecording && (
              <p className="text-xs text-muted-foreground">Mengirim audio...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
