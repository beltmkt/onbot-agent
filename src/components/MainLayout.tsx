import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OnBotChat } from './OnBotChat';
import { Sparkles } from 'lucide-react';
import { Header } from './Header';
import './MainLayout.css';

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

      {!isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed right-6 bottom-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 z-30 group"
          aria-label="Abrir Assistente IA"
        >
          <Sparkles size={24} />
        </button>
      )}

      {isAssistantOpen && <OnBotChat onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};
