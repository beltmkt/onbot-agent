import React from 'react';
import { Bot } from 'lucide-react';

export const ChatHeader: React.FC = () => (
  <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
    <Bot className="text-blue-400" />
    <h2 className="font-semibold text-lg">OnBot</h2>
  </div>
);
