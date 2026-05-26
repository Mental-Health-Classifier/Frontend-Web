/**
 * Chat context — manages the active chat session state, message list,
 * and the XAI predict / history calls.
 * Now grouping chats into multi-turn sessions using localStorage.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { xaiApi, analysisApi } from "@/lib/api";
import { LABEL_ID, buildAiContent } from "@/lib/audio-utils";
import { getLocalSessions, saveLocalSession, type ChatSession } from "./session-store";

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
  activeHistoryId: string | null;
  isLoading: boolean;
  isSending: boolean;
  loadingStatus: string | null;
  sendMessage: (text: string) => Promise<void>;
  sendAudio: (file: File) => Promise<void>;
  loadHistory: () => Promise<void>;
  loadHistoryItem: (id: string) => void;
  startNewChat: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseXaiResults(xaiResults: any[]): XaiLime | undefined {
  if (!xaiResults || xaiResults.length === 0) return undefined;

  const limeResult = xaiResults.find((r: any) => r.method === "lime" || r.method === "LIME");
  if (!limeResult?.explanation_data) return undefined;

  const data = limeResult.explanation_data;

  // Robust probability parsing — backend may send 0–1 or 0–100 scale
  const parseProb = (val: number | undefined) => {
    if (val === undefined || val === null) return 0;
    return val > 1 ? Math.round(val) : Math.round(val * 100);
  };

  const probabilities = { depression: 0, anxiety: 0, stress: 0 };
  if (data.probabilities) {
    probabilities.depression = parseProb(data.probabilities.depression ?? data.probabilities.Depression);
    probabilities.anxiety    = parseProb(data.probabilities.anxiety    ?? data.probabilities.Anxiety);
    probabilities.stress     = parseProb(data.probabilities.stress     ?? data.probabilities.Stress);
  } else if (data.class_probabilities) {
    probabilities.depression = parseProb(data.class_probabilities.depression ?? data.class_probabilities.Depression);
    probabilities.anxiety    = parseProb(data.class_probabilities.anxiety    ?? data.class_probabilities.Anxiety);
    probabilities.stress     = parseProb(data.class_probabilities.stress     ?? data.class_probabilities.Stress);
  }

  // Parse keywords from data.explanations: { label: [{word, score}] }
  const keyWords: XaiLime["keyWords"] = [];
  const explanations = data.explanations as Record<string, Array<{ word: string; score: number }>> | undefined;

  if (explanations) {
    const LABELS = ["depression", "anxiety", "stress"] as const;
    const sortedLabels = [...LABELS].sort((a, b) => (probabilities[b] ?? 0) - (probabilities[a] ?? 0));
    const seen = new Set<string>();
    for (const label of sortedLabels) {
      const positive = [...(explanations[label] ?? [])]
        .filter((ws) => ws.score > 0)
        .sort((a, b) => b.score - a.score);
      for (const { word } of positive) {
        if (!seen.has(word) && keyWords.length < 15) {
          keyWords.push({ word, classification: label });
          seen.add(word);
        }
      }
    }
    for (const label of sortedLabels) {
      for (const { word } of (explanations[label] ?? [])) {
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
  const [messages, setMessages]               = useState<ChatMessage[]>([]);
  const [history, setHistory]                 = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading]             = useState(false);
  const [isSending, setIsSending]             = useState(false);
  const [loadingStatus, setLoadingStatus]     = useState<string | null>(null);
  const rawPredictionsRef                     = useRef<any[]>([]);

  /* Load prediction history — merges localStorage sessions + backend */
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await xaiApi.getHistory();
      const backendPredictions = res.data ?? [];
      rawPredictionsRef.current = backendPredictions;

      const sessions  = getLocalSessions();
      const localIds  = new Set(sessions.map(s => s.id));

      const items: HistoryItem[] = sessions.map(s => ({
        id: s.id, preview: s.preview || "—", timestamp: s.timestamp, category: s.category,
      }));

      backendPredictions.forEach((p: any) => {
        const pId = String(p.id);
        if (!localIds.has(pId)) {
          items.push({
            id: pId,
            preview: p.input_text?.slice(0, 60) + (p.input_text?.length > 60 ? "..." : "") || "—",
            timestamp: new Date(p.created_at).toLocaleString("id-ID", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            }),
            category: p.category,
          });
        }
      });

      setHistory(items);
    } catch {
      // silently fail — sidebar stays empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Load a specific history item into the chat view */
  const loadHistoryItem = useCallback((id: string) => {
    const session = getLocalSessions().find(s => s.id === id);
    if (session) {
      setActiveHistoryId(id);
      setMessages(session.messages || []);
      return;
    }

    const prediction = rawPredictionsRef.current.find((p: any) => String(p.id) === id);
    if (!prediction) return;

    setActiveHistoryId(id);
    const category  = prediction.category ?? "Tidak diketahui";
    const confNum   = prediction.confidence ?? 0;
    const confVal   = confNum > 1 ? Math.round(confNum) : Math.round(confNum * 100);
    const userMsg: ChatMessage = {
      id: `hist-user-${id}`, type: "user",
      content: prediction.input_text ?? "—",
      timestamp: new Date(prediction.created_at).toISOString(),
    };
    const { content: aiContent } = buildAiContent(
      { category, confidence: confNum },
      undefined
    );
    const aiMsg: ChatMessage = {
      id: `hist-ai-${id}`, type: "ai",
      content: aiContent,
      timestamp: new Date(prediction.created_at).toISOString(),
    };
    setMessages([userMsg, aiMsg]);
  }, []);

  useEffect(() => {
    loadHistory().then(() => {
      const params    = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (sessionId) {
        loadHistoryItem(sessionId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Send a text message and get XAI prediction */
  const sendMessage = useCallback(async (text: string) => {
    const sessionId = activeHistoryId || `session-${Date.now()}`;
    if (!activeHistoryId) setActiveHistoryId(sessionId);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, type: "user",
      content: text, timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setLoadingStatus("Menganalisis teks...");
    const limeTimer = setTimeout(() => setLoadingStatus("Menerapkan LIME..."), 3500);

    try {
      const res = await xaiApi.predict(text);
      clearTimeout(limeTimer);
      const prediction = res.data?.prediction;
      const xaiResults = res.data?.xai_results ?? [];
      const xaiLime    = parseXaiResults(xaiResults);
      const topWords   = xaiLime?.keyWords.filter(kw => kw.classification !== "none").slice(0, 3).map(kw => kw.word).join(", ");

      const { content: aiContent } = buildAiContent(prediction, topWords);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`, type: "ai",
        content: aiContent, xaiLime, inputText: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, aiMsg];
        saveLocalSession({
          id: sessionId,
          preview: newMessages[0].content.slice(0, 60),
          timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
          category: prediction?.category,
          confidence: Math.round((prediction?.confidence ?? 0) * 100),
          messages: newMessages,
          updatedAt: Date.now(),
        });
        return newMessages;
      });

      await loadHistory();
    } catch (err: any) {
      clearTimeout(limeTimer);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`, type: "ai",
        content: `Maaf, terjadi kesalahan saat menganalisis: ${err.message || "Coba lagi nanti."}`,
      }]);
    } finally {
      setIsSending(false);
      setLoadingStatus(null);
    }
  }, [activeHistoryId, loadHistory]);

  /* Send audio → transcribe → XAI predict */
  const sendAudio = useCallback(async (file: File) => {
    const sessionId  = activeHistoryId || `session-${Date.now()}`;
    if (!activeHistoryId) setActiveHistoryId(sessionId);

    const userMsgId = `user-audio-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId, type: "user",
      content: "🎙️ Mengirim voice input...",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setLoadingStatus("Mentranskrip audio...");

    try {
      // Step 1: transcribe
      const res       = await analysisApi.sendAudio(file);
      const session   = res.data;
      const inputText: string = session?.input_text ?? "";

      if (!inputText.trim()) {
        setMessages((prev) => prev.map((m) =>
          m.id === userMsgId ? { ...m, content: "🎙️ (audio tidak terdeteksi)" } : m
        ));
        setMessages((prev) => [...prev, {
          id: `ai-audio-${Date.now()}`, type: "ai",
          content: "Audio tidak dapat ditranskripsi. Pastikan audio jelas dan berbahasa Indonesia.",
        }]);
        return;
      }

      setMessages((prev) => prev.map((m) =>
        m.id === userMsgId ? { ...m, content: `🎙️ "${inputText}"` } : m
      ));

      // Step 2: XAI predict on transcribed text
      setLoadingStatus("Menganalisis teks...");
      const limeTimer2 = setTimeout(() => setLoadingStatus("Menerapkan LIME..."), 3500);

      let xaiRes;
      try {
        xaiRes = await xaiApi.predict(inputText);
      } finally {
        clearTimeout(limeTimer2); // always cleared — never leaks on error
      }

      const prediction = xaiRes.data?.prediction;
      const xaiResults = xaiRes.data?.xai_results ?? [];
      const xaiLime    = parseXaiResults(xaiResults);
      const topWords   = xaiLime?.keyWords.filter(kw => kw.classification !== "none").slice(0, 3).map(kw => kw.word).join(", ");

      const { content: audioContent } = buildAiContent(prediction, topWords);

      const aiMsg: ChatMessage = {
        id: `ai-audio-${Date.now()}`, type: "ai",
        content: audioContent, xaiLime, inputText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, aiMsg];
        saveLocalSession({
          id: sessionId,
          preview: inputText.slice(0, 60),
          timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
          category: prediction?.category,
          confidence: Math.round((prediction?.confidence ?? 0) * 100),
          messages: newMessages,
          updatedAt: Date.now(),
        });
        return newMessages;
      });

      await loadHistory();
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `error-audio-${Date.now()}`, type: "ai",
        content: `Maaf, terjadi kesalahan saat memproses audio: ${err.message || "Coba lagi nanti."}`,
      }]);
    } finally {
      setIsSending(false);
      setLoadingStatus(null);
    }
  }, [activeHistoryId, loadHistory]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveHistoryId(null);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages, history, activeHistoryId,
      isLoading, isSending, loadingStatus,
      sendMessage, sendAudio,
      loadHistory, loadHistoryItem, startNewChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
