import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bot } from 'lucide-react'; // Importar o ícone Bot
import { Header } from './Header';
import './MainLayout.css';
import { AiAssistant } from './AiAssistant'; // Importar o novo componente AiAssistant

export const MainLayout: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="main-layout">
      {/* Sidebar para Desktop */}
      <div className="sidebar-desktop-container">
        <Sidebar />
      </div>

      {/* Sidebar para Mobile (com overlay) */}
      <div 
        className={`sidebar-mobile-container ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <div className="sidebar-mobile-content" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
        </div>
      </div>
      
      <div className="content-wrapper">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="content p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Botão flutuante para abrir o assistente de IA */}
      <div className="fixed bottom-4 right-4 z-50"> {/* Container para o FAB e o Chat */}
        {!isAssistantOpen && (
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 group
                       before:absolute before:inset-0 before:rounded-full before:bg-cyan-400 before:opacity-75 before:animate-ping before:group-hover:animate-none before:duration-700 before:ease-out"
            aria-label="Abrir Assistente IA"
          >
            <Bot className="w-7 h-7 relative z-10" /> {/* Ícone de Robô */}
          </button>
        )}

        {/* O novo componente AiAssistant (que será o chat) será posicionado aqui, relativo ao FAB */}
        {isAssistantOpen && <AiAssistant onClose={() => setIsAssistantOpen(false)} />}
      </div>
    </div>
  );
};
