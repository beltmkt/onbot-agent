// src/types/chat.ts
export interface SseEvent {
  event: 'typing' | 'delta' | 'final' | 'error' | 'ping';
  data: {
    message_id?: string;
    content?: string;
    partial?: boolean;
    role?: 'assistant' | 'user' | 'system';
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    latency_ms?: number;
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
  ts?: string;
}