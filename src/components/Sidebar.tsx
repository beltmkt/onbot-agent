import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react'; // Import X icon for close button
import { useAuth } from '../contexts/AuthContext';
// import './Sidebar.css'; // Remove custom CSS
import { toast } from 'sonner';
import { navigationData, NavSectionType, NavItemType } from '../data/navigation.tsx';

const NavItem: React.FC<{ item: NavItemType }> = ({ item }) => {
  const { to, icon, text, disabled } = item;

  if (disabled) {
    return (
      <li className="mb-2"> {/* Tailwind equivalent of nav-item */}
        <div className="flex items-center p-3 text-slate-400 cursor-not-allowed opacity-60"> {/* Tailwind equivalent of nav-link disabled */}
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 mr-3' })} {/* Add class to icon */}
          <span>{text}</span>
          <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">Em Breve</span> {/* Tailwind equivalent of coming-soon-badge */}
        </div>
      </li>
    );
  }

  return (
    <li className="mb-2"> {/* Tailwind equivalent of nav-item */}
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center p-3 rounded-lg transition-colors duration-200 ` +
          `${isActive ? 'bg-indigo-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}` // Tailwind equivalent of nav-link active/hover
        }
      >
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 mr-3' })} {/* Add class to icon */}
        <span>{text}</span>
      </NavLink>
    </li>
  );
};

const NavSection: React.FC<{ section: NavSectionType }> = ({ section }) => (
  <div className="mb-6"> {/* Tailwind equivalent of nav-section */}
    <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3 ml-3"> {/* Tailwind equivalent of nav-section-title */}
      {section.title}
    </h3>
    <ul>
      {section.items.map(item => <NavItem key={item.title} item={item} />)} {/* Use item.title as key */}
    </ul>
  </div>
);

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => { // Add onClose prop
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <aside className="h-full flex flex-col bg-slate-900 border-r border-white/10 p-4 shadow-xl"> {/* Tailwind equivalent of sidebar */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10"> {/* Tailwind equivalent of sidebar-header */}
        <h1 className="text-xl font-bold text-white">Onboarding Tools</h1>
        {onClose && ( // Render close button only if onClose is provided (for mobile)
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto"> {/* Enable scrolling for nav content */}
        {navigationData.map(section => <NavSection key={section.title} section={section} />)}
      </nav>
      <div className="pt-6 mt-6 border-t border-white/10 flex flex-col items-start space-y-4"> {/* Tailwind equivalent of sidebar-footer */}
        <span className="text-slate-400 text-sm">Olá, {user?.user_metadata?.name || user?.email}</span>
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm w-full justify-center"
        >
            <LogOut className="w-4 h-4" />
            Sair
        </button>
      </div>
    </aside>
  );
};