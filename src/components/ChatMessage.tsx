import React from 'react';

interface ChatMessageProps {
  sender: 'user' | 'bot';
  text: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text }) => (
  <div
    className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    <div
      className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
        sender === 'user'
          ? 'bg-blue-600 text-white rounded-br-none'
          : 'bg-gray-800 text-gray-100 rounded-bl-none'
      }`}
    >
      {text}
    </div>
  </div>
);
