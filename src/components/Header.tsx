import React from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Menu } from 'lucide-react';
import { navigationData } from '../data/navigation.tsx';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  // Filtra as seções que não são "EM BREVE" e extrai os itens
  const navItems = navigationData
    .filter(section => section.title !== 'EM BREVE')
    .flatMap(section => section.items);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/60">
      {/* Botão Hambúrguer (visível apenas em mobile) */}
      <button 
          onClick={onMenuClick}
          className="p-2 rounded-md text-gray-300 hover:bg-gray-700 md:hidden"
          aria-label="Abrir menu"
      >
          <Menu size={24} />
      </button>

      {/* Navegação Principal (visível apenas em desktop) */}
      <nav className="hidden md:flex items-center gap-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.text}
          </NavLink>
        ))}
      </nav>
      
      {/* Controles do lado direito */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
};