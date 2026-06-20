/**
 * Chat context — manages active chat state, message list, and XAI calls.
 * History is sourced exclusively from the backend (predictions table).
 * In-session multi-turn lives in React state only — no localStorage.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { xaiApi, analysisApi } from "@/lib/api";
import { buildAiContent } from "@/lib/audio-utils";
import { getResources, type ResourceEntry } from "@/lib/resources";

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
  resources?: ResourceEntry[];
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
  viewingHistoryId: string | null;
  isLoading: boolean;
  isSending: boolean;
  loadingStatus: string | null;
  sendMessage: (text: string) => Promise<void>;
  sendAudio: (file: File) => Promise<void>;
  loadHistory: () => Promise<void>;
  loadHistoryItem: (id: string) => Promise<void>;
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

// Returns one ResourceEntry per label that scored >= 50%, sorted by severity descending.
// Falls back to single top-label entry when xaiLime isn't available yet (optimistic render).
function computeResources(
  xaiLime: XaiLime | undefined,
  fallbackCategory?: string,
  fallbackConfidence?: number,
): ResourceEntry[] {
  if (xaiLime?.probabilities) {
    const entries: ResourceEntry[] = [];
    for (const cat of ["stress", "depression", "anxiety"] as const) {
      const pct = xaiLime.probabilities[cat] ?? 0;
      if (pct >= 50) {
        const entry = getResources(cat, pct / 100);
        if (entry) entries.push(entry);
      }
    }
    return entries.sort((a, b) => b.tier - a.tier);
  }
  if (fallbackCategory && fallbackConfidence !== undefined) {
    const entry = getResources(fallbackCategory, fallbackConfidence);
    return entry ? [entry] : [];
  }
  return [];
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages]                 = useState<ChatMessage[]>([]);
  const [history, setHistory]                   = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId]   = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading]               = useState(false);
  const [isSending, setIsSending]               = useState(false);
  const [loadingStatus, setLoadingStatus]       = useState<string | null>(null);
  const rawPredictionsRef                       = useRef<any[]>([]);

  /* Load history from backend only — no localStorage */
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await xaiApi.getHistory();
      const predictions = res.data ?? [];
      rawPredictionsRef.current = predictions;

      const items: HistoryItem[] = predictions.map((p: any) => ({
        id: String(p.id),
        preview: p.input_text?.slice(0, 60) + (p.input_text?.length > 60 ? "..." : "") || "—",
        timestamp: new Date(p.created_at).toLocaleString("id-ID", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        }),
        category: p.category,
      }));

      setHistory(items);
    } catch {
      // silently fail — sidebar stays empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Load a history item (read-only view) with full LIME data.
   * Fetches /xai/history/:id so xaiLime is populated for word highlights + bars. */
  const loadHistoryItem = useCallback(async (id: string) => {
    setViewingHistoryId(id);
    setActiveHistoryId(null);

    // Optimistic render with basic data while detail loads
    const cached = rawPredictionsRef.current.find((p: any) => String(p.id) === id);
    if (cached) {
      const { content } = buildAiContent(
        { category: cached.category, confidence: cached.confidence },
        undefined
      );
      const optimisticResources = computeResources(undefined, cached.category, cached.confidence);
      setMessages([
        { id: `hist-user-${id}`, type: "user", content: cached.input_text ?? "—", timestamp: new Date(cached.created_at).toISOString() },
        { id: `hist-ai-${id}`,   type: "ai",   content, resources: optimisticResources.length > 0 ? optimisticResources : undefined, timestamp: new Date(cached.created_at).toISOString() },
      ]);
    }

    // Fetch full detail to get xai_results → xaiLime
    try {
      const res        = await xaiApi.getHistoryDetail(id);
      const prediction = res.data?.prediction;
      const xaiResults = res.data?.xai_results ?? [];
      const xaiLime    = parseXaiResults(xaiResults);
      const topWords   = xaiLime?.keyWords
        .filter(kw => kw.classification !== "none").slice(0, 3)
        .map(kw => kw.word).join(", ");

      const { content: aiContent } = buildAiContent(prediction, topWords);

      const resources = computeResources(xaiLime, prediction?.category, prediction?.confidence);
      setMessages([
        {
          id: `hist-user-${id}`, type: "user",
          content: prediction?.input_text ?? cached?.input_text ?? "—",
          timestamp: new Date(prediction?.created_at ?? cached?.created_at).toISOString(),
        },
        {
          id: `hist-ai-${id}`, type: "ai",
          content: aiContent, xaiLime,
          inputText: prediction?.input_text ?? cached?.input_text,
          resources: resources.length > 0 ? resources : undefined,
          timestamp: new Date(prediction?.created_at ?? cached?.created_at).toISOString(),
        },
      ]);
    } catch {
      // keep the optimistic render on failure
    }
  }, []);

  useEffect(() => {
    loadHistory().then(() => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (sessionId) {
        loadHistoryItem(sessionId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Send text message → XAI predict */
  const sendMessage = useCallback(async (text: string) => {
    setViewingHistoryId(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, type: "user",
      content: text, timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setLoadingStatus("Menganalisis teks...");
    const limeTimer = setTimeout(() => setLoadingStatus("Menerapkan LIME..."), 3500);

    try {
      const res        = await xaiApi.predict(text);
      clearTimeout(limeTimer);
      const prediction = res.data?.prediction;
      const xaiResults = res.data?.xai_results ?? [];
      const xaiLime    = parseXaiResults(xaiResults);
      const topWords   = xaiLime?.keyWords
        .filter(kw => kw.classification !== "none").slice(0, 3)
        .map(kw => kw.word).join(", ");

      const { content: aiContent } = buildAiContent(prediction, topWords);
      const resources = computeResources(xaiLime, prediction?.category, prediction?.confidence);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`, type: "ai",
        content: aiContent, xaiLime, inputText: text,
        resources: resources.length > 0 ? resources : undefined,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (prediction?.id) setActiveHistoryId(String(prediction.id));
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
  }, [loadHistory]);

  /* Send audio → transcribe via analysis service → XAI predict */
  const sendAudio = useCallback(async (file: File) => {
    setViewingHistoryId(null);

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
      const inputText: string = res.data?.input_text ?? "";

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
      const limeTimer = setTimeout(() => setLoadingStatus("Menerapkan LIME..."), 3500);

      let xaiRes;
      try {
        xaiRes = await xaiApi.predict(inputText);
      } finally {
        clearTimeout(limeTimer);
      }

      const prediction = xaiRes.data?.prediction;
      const xaiResults = xaiRes.data?.xai_results ?? [];
      const xaiLime    = parseXaiResults(xaiResults);
      const topWords   = xaiLime?.keyWords
        .filter(kw => kw.classification !== "none").slice(0, 3)
        .map(kw => kw.word).join(", ");

      const { content: audioContent } = buildAiContent(prediction, topWords);
      const resources = computeResources(xaiLime, prediction?.category, prediction?.confidence);
      const aiMsg: ChatMessage = {
        id: `ai-audio-${Date.now()}`, type: "ai",
        content: audioContent, xaiLime, inputText,
        resources: resources.length > 0 ? resources : undefined,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (prediction?.id) setActiveHistoryId(String(prediction.id));
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
  }, [loadHistory]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveHistoryId(null);
    setViewingHistoryId(null);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages, history, activeHistoryId, viewingHistoryId,
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
