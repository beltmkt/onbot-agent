import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AiAssistantModal } from './AiAssistantModal';
import { Sparkles } from 'lucide-react';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="content">
        <Outlet />
      </main>

      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed right-6 bottom-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 z-30 group"
        aria-label="Abrir Assistente IA"
      >
        <Sparkles size={24} />
        <span className="absolute right-full mr-3 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Assistente IA
        </span>
      </button>

      {isAssistantOpen && <AiAssistantModal onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};
