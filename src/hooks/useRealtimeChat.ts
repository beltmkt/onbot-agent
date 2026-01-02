// src/hooks/useRealtimeChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from '../services/realtimeService';
import { SseEvent, ChatMessage } from '../types/chat';

// Converte as mensagens do chat para o formato de histórico do Gemini
const toGeminiHistory = (messages: ChatMessage[]) => {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
};

export const useRealtimeChat = (sessionId: string, userId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastUserMessageId = useRef<string | null>(null);

  const handleEvent = useCallback((event: SseEvent) => {
    // console.log('Evento SSE recebido:', event);
    
    switch (event.event) {
      case 'typing':
        setIsTyping(true);
        break;

      case 'chunk':
        setIsTyping(true);
        if (event.data.message_id && event.data.content) {
          setMessages(prev => {
            const existingMsgIndex = prev.findIndex(msg => msg.id === event.data.message_id);
            if (existingMsgIndex !== -1) {
              // Atualiza a mensagem de assistente existente
              const newMessages = [...prev];
              newMessages[existingMsgIndex].content += event.data.content;
              return newMessages;
            } else {
              // Cria uma nova mensagem de assistente se não existir
              return [...prev, {
                id: event.data.message_id,
                role: 'assistant',
                content: event.data.content,
                timestamp: new Date(),
                status: 'sending' // "sending" indica que está em progresso
              }];
            }
          });
        }
        break;

      case 'final':
        setIsTyping(false);
        if (event.data.message_id) {
          setMessages(prev => prev.map(msg =>
            msg.id === event.data.message_id ? { ...msg, status: 'sent' } : msg
          ));
        }
        break;

      case 'error':
        setIsTyping(false);
        setError(event.data.detail || `Erro: ${event.data.code}`);
        if (lastUserMessageId.current) {
          setMessages(prev => prev.map(msg =>
            msg.id === lastUserMessageId.current ? { ...msg, status: 'error' } : msg
          ));
        }
        break;

      case 'ping':
        // Mantém a conexão ativa, nenhum estado precisa ser alterado
        break;
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const messageId = crypto.randomUUID();
    lastUserMessageId.current = messageId;

    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sending'
    };

    // Prepara o histórico antes de adicionar a nova mensagem
    const historyForApi = toGeminiHistory(messages);

    setMessages(prev => [...prev, userMessage]);

    try {
      // Envia a mensagem e o histórico
      await realtimeService.sendMessage(text, sessionId, userId, messageId, historyForApi);
      
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'sent' } : msg
      ));
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'error' } : msg
      ));
    }
  }, [sessionId, userId, messages]);

  useEffect(() => {
    const cleanup = realtimeService.connect(sessionId, handleEvent);
    setIsConnected(true);

    return () => {
      cleanup();
      setIsConnected(false);
    };
  }, [sessionId, handleEvent]);

  return {
    messages,
    isTyping,
    isConnected,
    error,
    sendMessage,
    clearError: () => setError(null)
  };
};