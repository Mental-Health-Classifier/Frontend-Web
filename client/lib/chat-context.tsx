/**
 * Chat context — manages the active chat session state, message list,
 * and the XAI predict / history calls.
 *
 * Shared between ChatInput, ChatMessages, and ChatSidebar so they
 * all react to the same data without prop-drilling.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { xaiApi, analysisApi } from "@/lib/api";
import { LABEL_ID, buildAiContent } from "@/lib/audio-utils";

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
  inputText?: string;   // original user text — used for inline highlighting
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
  loadingStatus: string | null;   // current step label shown in typing indicator
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

  const limeResult = xaiResults.find((r: any) => r.method === "LIME" || r.method === "lime");
  if (!limeResult?.explanation_data) return undefined;

  const data = limeResult.explanation_data;

  // Backend stores probabilities already as percentages (75.0, not 0.75)
  const probabilities = {
    depression: Math.round(data.probabilities?.depression ?? 0),
    anxiety:    Math.round(data.probabilities?.anxiety    ?? 0),
    stress:     Math.round(data.probabilities?.stress     ?? 0),
  };

  // Parse keywords from data.explanations: { label: [{word, score}] }
  // Each label's words with positive LIME scores support that label
  const keyWords: XaiLime["keyWords"] = [];
  const explanations = data.explanations as Record<string, Array<{ word: string; score: number }>> | undefined;

  if (explanations) {
    const LABELS = ["depression", "anxiety", "stress"] as const;
    // Process labels in order of highest probability so dominant class keywords appear first
    const sortedLabels = [...LABELS].sort(
      (a, b) => (probabilities[b] ?? 0) - (probabilities[a] ?? 0)
    );
    const seen = new Set<string>();
    for (const label of sortedLabels) {
      const wordScores = explanations[label] ?? [];
      // Sort by score descending, keep only positive (word supports that label)
      const positive = [...wordScores]
        .filter((ws) => ws.score > 0)
        .sort((a, b) => b.score - a.score);
      for (const { word } of positive) {
        if (!seen.has(word) && keyWords.length < 15) {
          keyWords.push({ word, classification: label });
          seen.add(word);
        }
      }
    }
    // Add negative-score words (no strong class) as "none" so text still annotated
    for (const label of sortedLabels) {
      const wordScores = explanations[label] ?? [];
      for (const { word } of wordScores) {
        if (!seen.has(word) && keyWords.length < 20) {
          keyWords.push({ word, classification: "none" });
          seen.add(word);
        }
      }
    }
  }

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
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

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
    setLoadingStatus("Menganalisis teks...");
    // switch to LIME step after ~3.5 s (inference phase done)
    const limeTimer = setTimeout(() => setLoadingStatus("Menerapkan LIME..."), 3500);

    try {
      const res = await xaiApi.predict(text);
      clearTimeout(limeTimer);
      const prediction = res.data?.prediction;
      const xaiResults = res.data?.xai_results ?? [];

      const xaiLime  = parseXaiResults(xaiResults);
      const topWords = xaiLime?.keyWords.filter(kw => kw.classification !== "none").slice(0, 3).map(kw => kw.word).join(", ");

      const { content: aiContent } = buildAiContent(prediction, topWords);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: aiContent,
        xaiLime,
        inputText: text,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Refresh history after new prediction
      await loadHistory();
    } catch (err: any) {
      clearTimeout(limeTimer);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "ai",
        content: `Maaf, terjadi kesalahan saat menganalisis: ${err.message || "Coba lagi nanti."}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      setLoadingStatus(null);
    }
  }, [loadHistory]);

  /* Send audio for transcription + XAI analysis */
  const sendAudio = useCallback(async (file: File) => {
    const userMsgId = `user-audio-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      type: "user",
      content: "🎙️ Mengirim voice input...",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setLoadingStatus("Mentranskrip audio...");

    try {
      // Step 1: transcribe audio + save analysis session
      const res = await analysisApi.sendAudio(file);
      const session = res.data;
      const inputText: string = session?.input_text ?? "";

      if (!inputText.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId ? { ...m, content: "🎙️ (audio tidak terdeteksi)" } : m
          )
        );
        const aiMsg: ChatMessage = {
          id: `ai-audio-${Date.now()}`,
          type: "ai",
          content: "Audio tidak dapat ditranskripsi. Pastikan audio jelas dan berbahasa Indonesia.",
        };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }

      // Update user bubble with transcription result
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId ? { ...m, content: `🎙️ "${inputText}"` } : m
        )
      );

      // Step 2: run XAI predict on the transcribed text for LIME visualization
      setLoadingStatus("Menganalisis teks...");
      const limeTimer2 = setTimeout(() => setLoadingStatus("Menerapkan LIME..."), 3500);

      let xaiRes;
      try {
        xaiRes = await xaiApi.predict(inputText);
      } finally {
        clearTimeout(limeTimer2); // always cleared — never leaks
      }

      const prediction  = xaiRes.data?.prediction;
      const xaiResults  = xaiRes.data?.xai_results ?? [];
      const xaiLime     = parseXaiResults(xaiResults);
      const topWords    = xaiLime?.keyWords.filter(kw => kw.classification !== "none").slice(0, 3).map(kw => kw.word).join(", ");

      const { content: audioContent } = buildAiContent(prediction, topWords);

      const aiMsg: ChatMessage = {
        id: `ai-audio-${Date.now()}`,
        type: "ai",
        content: audioContent,
        xaiLime,
        inputText,
      };
      setMessages((prev) => [...prev, aiMsg]);
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
      setLoadingStatus(null);
    }
  }, [loadHistory]);

  /* Start a new chat — clear messages */
  const startNewChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, history, isLoading, isSending, loadingStatus, sendMessage, sendAudio, loadHistory, startNewChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
