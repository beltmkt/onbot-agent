// src/components/OnBotChat/hooks.ts
import { useState, useRef, useEffect } from 'react';

export const useChatScroll = (dependencies: any[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, dependencies);

  return scrollRef;
};

export const useChatInput = (onSend: (message: string) => void, isLoading: boolean) => {
  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!inputMessage.trim() || isLoading) return;
    
    onSend(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return {
    inputMessage,
    setInputMessage,
    inputRef,
    handleSend,
    handleKeyPress
  };
};