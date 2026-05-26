import { ChatMessage } from "./chat-context";

export interface ChatSession {
  id: string;
  preview: string;
  timestamp: string;
  category?: string;
  confidence?: number;
  messages: ChatMessage[];
  updatedAt: number;
}

export const getLocalSessions = (): ChatSession[] => {
  try {
    const data = localStorage.getItem("mindcare_sessions");
    if (!data) return [];
    const sessions = JSON.parse(data) as ChatSession[];
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};

export const saveLocalSession = (session: ChatSession) => {
  const sessions = getLocalSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem("mindcare_sessions", JSON.stringify(sessions));
};
