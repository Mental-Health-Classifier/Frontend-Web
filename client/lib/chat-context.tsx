/**
 * Chat context — manages the active chat session state, message list,
 * and the XAI predict / history calls.
 * Now grouping chats into multi-turn sessions using localStorage.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { xaiApi, analysisApi } from "@/lib/api";
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

  const probabilities = {
    depression: 0,
    anxiety: 0,
    stress: 0,
  };

  const parseProb = (val: number | undefined) => {
    if (val === undefined || val === null) return 0;
    return val > 1 ? Math.round(val) : Math.round(val * 100);
  };

  if (data.probabilities) {
    probabilities.depression = parseProb(data.probabilities.depression ?? data.probabilities.Depression);
    probabilities.anxiety = parseProb(data.probabilities.anxiety ?? data.probabilities.Anxiety);
    probabilities.stress = parseProb(data.probabilities.stress ?? data.probabilities.Stress);
  } else if (data.class_probabilities) {
    probabilities.depression = parseProb(data.class_probabilities.depression ?? data.class_probabilities.Depression);
    probabilities.anxiety = parseProb(data.class_probabilities.anxiety ?? data.class_probabilities.Anxiety);
    probabilities.stress = parseProb(data.class_probabilities.stress ?? data.class_probabilities.Stress);
  }

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
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const rawPredictionsRef = useRef<any[]>([]);

  /* Load prediction history for sidebar from local storage and backend */
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await xaiApi.getHistory();
      const backendPredictions = res.data ?? [];
      rawPredictionsRef.current = backendPredictions;

      const sessions = getLocalSessions();
      const localIds = new Set(sessions.map(s => s.id));
      
      const items: HistoryItem[] = sessions.map(s => ({
        id: s.id,
        preview: s.preview || "—",
        timestamp: s.timestamp,
        category: s.category,
      }));

      // Append backend history that is not in local sessions
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
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Load a specific history item into the chat view */
  const loadHistoryItem = useCallback((id: string) => {
    const sessions = getLocalSessions();
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveHistoryId(id);
      setMessages(session.messages || []);
      return;
    }

    // Fallback to backend prediction if not found in local storage
    const prediction = rawPredictionsRef.current.find((p: any) => String(p.id) === id);
    if (!prediction) return;

    setActiveHistoryId(id);
    const userMsg: ChatMessage = {
      id: `hist-user-${id}`,
      type: "user",
      content: prediction.input_text ?? "—",
      timestamp: new Date(prediction.created_at).toISOString(),
    };
    const category = prediction.category ?? "Tidak diketahui";
    const confVal = prediction.confidence ? (prediction.confidence > 1 ? Math.round(prediction.confidence) : Math.round(prediction.confidence * 100)) : 0;
    const confidence = confVal > 0 ? `${confVal}%` : "";
    const aiMsg: ChatMessage = {
      id: `hist-ai-${id}`,
      type: "ai",
      content: `Berdasarkan analisis, teks Anda terdeteksi sebagai **${category}** ${confidence ? `dengan Confidence Score ${confidence}` : ""}. Silakan lihat hasil analisis di bawah ini.`,
      timestamp: new Date(prediction.created_at).toISOString(),
    };
    setMessages([userMsg, aiMsg]);
  }, []);

  // Check URL parameters for active session to load on mount
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

  /* Send a text message and get XAI prediction */
  const sendMessage = useCallback(async (text: string) => {
    const sessionId = activeHistoryId || `session-${Date.now()}`;
    if (!activeHistoryId) setActiveHistoryId(sessionId);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: text,
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await xaiApi.predict(text);
      const prediction = res.data?.prediction;
      const xaiResults = res.data?.xai_results ?? [];
      const xaiLime = parseXaiResults(xaiResults);

      const category = prediction?.category ?? "Tidak diketahui";
      const confidence = prediction?.confidence
        ? `${Math.round(prediction.confidence * 100)}%`
        : "";

      const aiContent = `Berdasarkan analisis, teks Anda terdeteksi sebagai **${category}** ${confidence ? `dengan Confidence Score ${confidence}` : ""}. ${xaiLime
          ? "Berikut adalah penjelasan detail dari model XAI LIME."
          : "Silakan lihat hasil analisis di bawah ini."
        }`;

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: aiContent,
        xaiLime,
        timestamp: new Date().toISOString()
      };
      
      setMessages((prev) => {
        const newMessages = [...prev, aiMsg];
        
        saveLocalSession({
          id: sessionId,
          preview: newMessages[0].content.slice(0, 60),
          timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
          category: category,
          confidence: Math.round((prediction?.confidence || 0) * 100),
          messages: newMessages,
          updatedAt: Date.now()
        });

        return newMessages;
      });

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
  }, [activeHistoryId, loadHistory]);

  /* Send audio for transcription + analysis */
  const sendAudio = useCallback(async (file: File) => {
    const sessionId = activeHistoryId || `session-${Date.now()}`;
    if (!activeHistoryId) setActiveHistoryId(sessionId);

    const userMsg: ChatMessage = {
      id: `user-audio-${Date.now()}`,
      type: "user",
      content: "🎙️ Mengirim input suara...",
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await analysisApi.sendAudio(file);
      const sessionData = res.data;
      const inputText = sessionData?.input_text ?? "Audio berhasil ditranskripsi";

      const xaiResults = sessionData?.xai_results ?? [];
      const xaiLime = parseXaiResults(xaiResults);
      const prediction = sessionData?.prediction ?? sessionData;
      const category = prediction?.category ?? "Tidak diketahui";
      const confidence = prediction?.confidence
        ? `${Math.round(prediction.confidence * 100)}%`
        : "";

      const aiContent = category !== "Tidak diketahui" 
        ? `Berdasarkan analisis audio, teks Anda terdeteksi sebagai **${category}** ${confidence ? `dengan Confidence Score ${confidence}` : ""}. ${xaiLime ? "Berikut adalah penjelasan detail dari model XAI LIME." : "Silakan lihat hasil analisis di bawah ini."}`
        : "Audio Anda telah berhasil ditranskripsi. Silakan lihat hasil analisis di dasbor.";

      const aiMsg: ChatMessage = {
        id: `ai-audio-${Date.now()}`,
        type: "ai",
        content: aiContent,
        xaiLime,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => {
        const mapped = prev.map((m) =>
          m.id === userMsg.id ? { ...m, content: `🎙️ "${inputText}"` } : m
        );
        const newMessages = [...mapped, aiMsg];

        saveLocalSession({
          id: sessionId,
          preview: newMessages[0].content.slice(0, 60),
          timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
          category: category,
          confidence: Math.round((prediction?.confidence || 0) * 100),
          messages: newMessages,
          updatedAt: Date.now()
        });

        return newMessages;
      });

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
  }, [activeHistoryId, loadHistory]);

  /* Start a new chat — clear messages */
  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveHistoryId(null);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, history, activeHistoryId, isLoading, isSending, sendMessage, sendAudio, loadHistory, loadHistoryItem, startNewChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
