// src/types/chat.ts
export interface SseEvent {
  event: 'typing' | 'chunk' | 'final' | 'error' | 'ping';
  data: {
    message_id?: string;
    content?: string;
    role?: 'assistant' | 'user' | 'system';
    code?: string;
    detail?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export interface SendMessagePayload {
  message_id: string;
  session_id: string;
  user_id: string;
  text: string;
  history?: { role: string; parts: { text: string }[] }[];
  ts?: string;
}