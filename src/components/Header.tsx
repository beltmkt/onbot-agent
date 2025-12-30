import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 md:justify-end">
        {/* Botão Hambúrguer (visível apenas em mobile) */}
        <button 
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-300 hover:bg-gray-700 md:hidden"
            aria-label="Abrir menu"
        >
            <Menu size={24} />
        </button>
        
        {/* Toggle de Tema */}
        <ThemeToggle />
    </header>
  );
};