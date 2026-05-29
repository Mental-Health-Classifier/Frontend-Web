/**
 * audio-utils.ts — shared helpers for audio recording and AI response building.
 * Centralises logic used by ChatInput (recording) and chat-context (sending).
 */

/* ── MIME type detection ───────────────────────────────────────────── */

export function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function mimeToExt(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function buildAudioFile(chunks: Blob[], mimeType: string): File {
  const mime = mimeType || "audio/webm";
  const ext  = mimeToExt(mime);
  const blob = new Blob(chunks, { type: mime });
  return new File([blob], `recording.${ext}`, { type: mime });
}

/* ── AI response builder (shared between text + audio paths) ────────── */

const LABEL_ID: Record<string, string> = {
  depression: "depresi",
  anxiety:    "kecemasan",
  stress:     "stres",
};

export interface AiResponseResult {
  content: string;
  confNum: number;
}

export function buildAiContent(
  prediction: { category?: string; confidence?: number } | undefined,
  topWords: string | undefined
): AiResponseResult {
  const category   = prediction?.category ?? "unknown";
  const confNum    = prediction?.confidence ?? 0;
  const labelID    = LABEL_ID[category] ?? category;
  const confidence = `${Math.round(confNum * 100)}%`;

  const content = confNum < 0.5
    ? `Tidak terdeteksi gangguan mental yang signifikan. Perasaan Anda tampak dalam batas normal.${topWords ? ` Kata yang dianalisis: ${topWords}.` : ""}`
    : `Perasaan Anda menunjukkan tanda ${labelID} dengan kepercayaan ${confidence}.${topWords ? ` Kata yang paling berpengaruh: ${topWords}.` : ""}`;

  return { content, confNum };
}

/* ── Device change watcher ─────────────────────────────────────────── */

/**
 * Calls onDeviceChange whenever the user's audio input devices change.
 * Returns an unsubscribe function.
 */
export function watchMicDevices(onDeviceChange: () => void): () => void {
  if (!navigator.mediaDevices?.addEventListener) return () => {};
  navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
  return () => navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
}
