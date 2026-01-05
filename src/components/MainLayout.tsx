import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
// import './MainLayout.css'; // This CSS file is no longer needed

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen"> {/* Main container for the layout, relative for positioning background elements */}
      {/* Aurora Background - Global Glows */}
      <div className="aurora-bg">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      {/* Radial Gradient / Vignette Effect (as part of the background, applied subtly) */}
      {/* This creates a central focus by subtly darkening the edges. */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-slate-950/50 to-slate-950 z-0"></div>

      {/* Main content wrapper, positioned above the background effects */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar para Desktop */}
        {/* Hidden on small screens, shown on medium and larger screens */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Sidebar para Mobile (com overlay e transição) */}
        {/* Overlay escuro que fecha a sidebar ao clicar fora */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-40 transition-opacity duration-300 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        {/* Sidebar móvel que desliza da esquerda */}
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-white/10 z-50 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:hidden`}
        >
          {/* Passa a prop onClose para permitir que a sidebar se feche */}
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
        
        {/* Área de conteúdo principal (Header e Outlet) */}
        <div className="flex-1 flex flex-col"> {/* flex-1 para ocupar o espaço restante */}
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-8 relative"> {/* flex-1 para o conteúdo ocupar a altura disponível */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};