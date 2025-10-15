// src/hooks/useRealtimeChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService } from '../services/realtime';
import { SseEvent, ChatMessage, SendMessagePayload } from '../types/chat';

export const useRealtimeChat = (sessionId: string, userId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referência para a última mensagem do usuário
  const lastUserMessageId = useRef<string | null>(null);

  // Processa eventos SSE
  const handleEvent = useCallback((event: SseEvent) => {
    console.log('Evento SSE recebido:', event);
    
    switch (event.event) {
      case 'typing':
        setIsTyping(true);
        break;

      case 'delta':
        // Atualização parcial (streaming)
        if (event.data.message_id && event.data.content) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage?.role === 'assistant' && lastMessage.id === event.data.message_id) {
              // Atualiza mensagem existente
              lastMessage.content += event.data.content;
            } else {
              // Cria nova mensagem parcial
              newMessages.push({
                id: event.data.message_id!,
                role: 'assistant',
                content: event.data.content,
                timestamp: new Date(),
                status: 'sent'
              });
            }
            
            return newMessages;
          });
        }
        break;

      case 'final':
        setIsTyping(false);
        
        if (event.data.message_id && event.data.content) {
          setMessages(prev => {
            // Remove mensagens parciais e adiciona a final
            const filtered = prev.filter(msg => 
              !(msg.id === event.data.message_id && msg.role === 'assistant')
            );
            
            return [
              ...filtered,
              {
                id: event.data.message_id,
                role: 'assistant',
                content: event.data.content,
                timestamp: new Date(),
                status: 'sent'
              }
            ];
          });
        }
        break;

      case 'error':
        setIsTyping(false);
        setError(event.data.detail || `Erro: ${event.data.code}`);
        
        // Marca a última mensagem do usuário como erro
        if (lastUserMessageId.current) {
          setMessages(prev => prev.map(msg =>
            msg.id === lastUserMessageId.current ? { ...msg, status: 'error' } : msg
          ));
        }
        break;

      case 'ping':
        // Mantém conexão ativa
        break;
    }
  }, []);

  // Envia mensagem
  const sendMessage = useCallback(async (text: string) => {
    const messageId = crypto.randomUUID();
    lastUserMessageId.current = messageId;

    // Adiciona mensagem do usuário imediatamente
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const payload: SendMessagePayload = {
        message_id: messageId,
        session_id: sessionId,
        user_id: userId,
        text: text
      };

      await realtimeService.sendMessage(payload);
      
      // Atualiza status para enviado
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'sent' } : msg
      ));

    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Marca mensagem como erro
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'error' } : msg
      ));
    }
  }, [sessionId, userId]);

  // Conecta ao SSE quando o componente monta
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