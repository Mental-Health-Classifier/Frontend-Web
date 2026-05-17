import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Send, Loader2, MicOff, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/chat-context";

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function ChatInput() {
  const [message, setMessage]               = useState("");
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const [isRecording, setIsRecording]       = useState(false);
  const [recordingTime, setRecordingTime]   = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isUploading, setIsUploading]       = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  const { sendMessage, sendAudio, isSending } = useChat();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleSend = async () => {
    if (message.trim() && !isSending) {
      const text = message.trim();
      setMessage("");
      await sendMessage(text);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Recording                                                           */
  /* ------------------------------------------------------------------ */

  const handleStartRecording = async () => {
    setPermissionError(null);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionError("Izin mikrofon ditolak. Izinkan akses mikrofon di browser Anda lalu coba lagi.");
      } else {
        setPermissionError("Mikrofon tidak tersedia atau tidak didukung browser ini.");
      }
      return;
    }

    streamRef.current = stream;

    // Pick the best supported MIME type
    const mimeType = (
      ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]
        .find((t) => MediaRecorder.isTypeSupported(t))
    ) ?? "";

    const mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stream.getTracks().forEach((t) => t.stop());

      const mime = mediaRecorder.mimeType || "audio/webm";
      const ext  = mime.includes("ogg") ? "ogg" : "webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const file = new File([blob], `recording.${ext}`, { type: mime });

      setIsRecording(false);
      setRecordingTime(0);
      setIsUploading(true);
      setIsVoiceDialogOpen(false);

      try {
        await sendAudio(file);
      } finally {
        setIsUploading(false);
      }
    };

    // 100 ms timeslice = chunks arrive continuously, more reliable than single chunk
    mediaRecorder.start(100);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;

    if (recordingTime < 1) {
      // Too short — cancel without uploading
      mediaRecorderRef.current.ondataavailable = null;
      const originalOnStop = mediaRecorderRef.current.onstop;
      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
      return;
    }

    mediaRecorderRef.current.stop();
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && isRecording) handleStopRecording();
    if (!open) setPermissionError(null);
    setIsVoiceDialogOpen(open);
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */

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
              title="Rekam suara"
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
          Ctrl + Enter untuk kirim · Percakapan Anda bersifat rahasia
        </p>
      </div>

      {/* Voice Recording Dialog */}
      <Dialog open={isVoiceDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Rekam Suara</DialogTitle>
            <DialogDescription>
              Bicara dalam bahasa Indonesia. Rekaman akan ditranskripsi otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-5 py-4">

            {/* Permission error */}
            {permissionError && (
              <div className="flex items-start gap-2 w-full rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive leading-relaxed">{permissionError}</p>
              </div>
            )}

            {/* Recording state visual */}
            {isRecording ? (
              <div className="flex flex-col items-center gap-3">
                {/* Animated pulse rings */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute w-14 h-14 rounded-full bg-red-500/30 animate-pulse" />
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                </div>
                {/* Timer */}
                <div className="text-2xl font-mono font-bold text-red-500 tabular-nums">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-xs text-muted-foreground">Merekam... tekan Stop untuk selesai</p>
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

            {/* Action buttons */}
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
