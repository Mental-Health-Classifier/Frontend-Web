/**
 * Chat context — manages the active chat session state, message list,
 * and the XAI predict / history calls.
 *
 * Shared between ChatInput, ChatMessages, and ChatSidebar so they
 * all react to the same data without prop-drilling.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { xaiApi, analysisApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface XaiLime {
  probabilities: {
    depression: number;
    anxiety: number;
    stress: number;
  };
  keyWords: Array<{
    word: string;
    classification: "depression" | "anxiety" | "stress" | "none";
  }>;
}

export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  xaiLime?: XaiLime;
  timestamp?: string;
}

export interface HistoryItem {
  id: string;
  preview: string;
  timestamp: string;
  category?: string;
}

interface ChatContextValue {
  messages: ChatMessage[];
  history: HistoryItem[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (text: string) => Promise<void>;
  sendAudio: (file: File) => Promise<void>;
  loadHistory: () => Promise<void>;
  startNewChat: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseXaiResults(xaiResults: any[]): XaiLime | undefined {
  if (!xaiResults || xaiResults.length === 0) return undefined;

  // Find LIME result
  const limeResult = xaiResults.find((r: any) => r.method === "lime" || r.method === "LIME");
  if (!limeResult?.explanation_data) return undefined;

  const data = limeResult.explanation_data;

  // Parse probabilities from explanation_data
  const probabilities = {
    depression: 0,
    anxiety: 0,
    stress: 0,
  };

  // Handle different explanation_data formats
  if (data.probabilities) {
    probabilities.depression = Math.round((data.probabilities.depression ?? data.probabilities.Depression ?? 0) * 100);
    probabilities.anxiety = Math.round((data.probabilities.anxiety ?? data.probabilities.Anxiety ?? 0) * 100);
    probabilities.stress = Math.round((data.probabilities.stress ?? data.probabilities.Stress ?? 0) * 100);
  } else if (data.class_probabilities) {
    probabilities.depression = Math.round((data.class_probabilities.depression ?? data.class_probabilities.Depression ?? 0) * 100);
    probabilities.anxiety = Math.round((data.class_probabilities.anxiety ?? data.class_probabilities.Anxiety ?? 0) * 100);
    probabilities.stress = Math.round((data.class_probabilities.stress ?? data.class_probabilities.Stress ?? 0) * 100);
  }

  // Parse keywords
  const keyWords: XaiLime["keyWords"] = [];
  if (data.feature_importance || data.features) {
    const features = data.feature_importance ?? data.features ?? [];
    for (const feat of features) {
      const word = feat.feature ?? feat.word ?? feat.token ?? "";
      const cls = (feat.class ?? feat.classification ?? "none").toLowerCase();
      const classification = ["depression", "anxiety", "stress"].includes(cls) ? cls as any : "none";
      if (word) keyWords.push({ word, classification });
    }
  } else if (data.explanation && Array.isArray(data.explanation)) {
    for (const [word, weight] of data.explanation) {
      keyWords.push({ word, classification: "none" });
    }
  }

  // If no structured data found, return probabilities at least
  if (probabilities.depression === 0 && probabilities.anxiety === 0 && probabilities.stress === 0) {
    return undefined;
  }

  return { probabilities, keyWords };
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  /* Load prediction history for sidebar */
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await xaiApi.getHistory();
      const predictions = res.data ?? [];
      const items: HistoryItem[] = predictions.map((p: any) => ({
        id: p.id,
        preview: p.input_text?.slice(0, 60) + (p.input_text?.length > 60 ? "..." : "") || "—",
        timestamp: new Date(p.created_at).toLocaleString("id-ID", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        }),
        category: p.category,
      }));
      setHistory(items);
    } catch {
      // silently fail — sidebar will just be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /* Send a text message and get XAI prediction */
  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await xaiApi.predict(text);
      const prediction = res.data?.prediction;
      const xaiResults = res.data?.xai_results ?? [];

      const xaiLime = parseXaiResults(xaiResults);

      // Build AI response text
      const category = prediction?.category ?? "Unknown";
      const confidence = prediction?.confidence
        ? `${Math.round(prediction.confidence * 100)}%`
        : "";

      const aiContent = `Berdasarkan analisis, teks Anda terdeteksi sebagai **${category}** ${confidence ? `dengan tingkat kepercayaan ${confidence}` : ""}. ${xaiLime
          ? "Berikut adalah penjelasan detail dari model XAI LIME."
          : "Silakan lihat hasil analisis di bawah ini."
        }`;

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: aiContent,
        xaiLime,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Refresh history after new prediction
      await loadHistory();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "ai",
        content: `Maaf, terjadi kesalahan saat menganalisis: ${err.message || "Coba lagi nanti."}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }, [loadHistory]);

  /* Send audio for transcription + analysis */
  const sendAudio = useCallback(async (file: File) => {
    const userMsg: ChatMessage = {
      id: `user-audio-${Date.now()}`,
      type: "user",
      content: "🎙️ Voice input dikirim...",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await analysisApi.sendAudio(file);
      const session = res.data;
      const inputText = session?.input_text ?? "Audio berhasil ditranskripsi";

      // Update user message with transcribed text
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id ? { ...m, content: `🎙️ "${inputText}"` } : m
        )
      );

      // Now run XAI predict on the transcribed text
      if (inputText && inputText !== "Audio berhasil ditranskripsi") {
        const aiMsg: ChatMessage = {
          id: `ai-audio-${Date.now()}`,
          type: "ai",
          content: "Audio Anda telah berhasil ditranskripsi. Namun, prediksi mental health saat ini belum dapat dilakukan karena belum diintegrasikan dengan model prediksinya.",
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const aiMsg: ChatMessage = {
          id: `ai-audio-${Date.now()}`,
          type: "ai",
          content: "Audio Anda telah diproses. Silakan lihat hasil analisis di dashboard.",
        };
        setMessages((prev) => [...prev, aiMsg]);
      }

      await loadHistory();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-audio-${Date.now()}`,
        type: "ai",
        content: `Maaf, terjadi kesalahan saat memproses audio: ${err.message || "Coba lagi nanti."}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }, [loadHistory]);

  /* Start a new chat — clear messages */
  const startNewChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, history, isLoading, isSending, sendMessage, sendAudio, loadHistory, startNewChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
