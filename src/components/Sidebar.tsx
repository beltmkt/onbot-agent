import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'; // Import X icon for close button
import { useAuth } from '../contexts/AuthContext';
// import './Sidebar.css'; // Remove custom CSS
import { toast } from 'sonner';
import { navigationData, NavSectionType, NavItemType } from '../data/navigation.tsx';

const NavItem: React.FC<{ item: NavItemType; isCollapsed: boolean }> = ({ item, isCollapsed }) => {
  const { to, icon, text, disabled } = item;

  const iconClasses = `w-5 h-5 ${isCollapsed ? 'mr-0' : 'mr-3'}`; // Adjust margin based on collapsed state

  if (disabled) {
    return (
      <li className="mb-2">
        <div className={`flex items-center p-3 text-slate-400 cursor-not-allowed opacity-60 ${isCollapsed ? 'justify-center' : ''}`}>
          {React.cloneElement(icon as React.ReactElement, { className: iconClasses })}
          {!isCollapsed && <span>{text}</span>}
          {!isCollapsed && <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">Em Breve</span>}
        </div>
      </li>
    );
  }

  return (
    <li className="mb-2">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center p-3 rounded-lg transition-colors duration-200 ` +
          `${isActive ? 'bg-indigo-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'} ` +
          `${isCollapsed ? 'justify-center' : ''}` // Center content when collapsed
        }
      >
        {React.cloneElement(icon as React.ReactElement, { className: iconClasses })}
        {!isCollapsed && <span>{text}</span>}
      </NavLink>
    </li>
  );
};

const NavSection: React.FC<{ section: NavSectionType; isCollapsed: boolean }> = ({ section, isCollapsed }) => (
  <div className="mb-6">
    {!isCollapsed && (
      <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3 ml-3">
        {section.title}
      </h3>
    )}
    <ul>
      {section.items.map(item => <NavItem key={item.title} item={item} isCollapsed={isCollapsed} />)}
    </ul>
  </div>
);

interface SidebarProps {
  onClose?: () => void; // For mobile sidebar
  isCollapsed: boolean; // For desktop sidebar collapse state
  toggleCollapse: () => void; // For desktop sidebar toggle function
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, isCollapsed, toggleCollapse }) => {
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
    <aside className={`h-full flex flex-col bg-slate-900 border-r border-white/10 shadow-xl transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 p-2' : 'w-64 p-4'}`}>
      <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} pb-6 mb-6 border-b border-white/10`}>
        {!isCollapsed && <h1 className="text-xl font-bold text-white whitespace-nowrap">Onboarding Tools</h1>}
        
        {/* Toggle Button for Desktop Sidebar */}
        {!onClose && ( // Only show for desktop sidebar (when onClose is NOT provided)
          <button 
            onClick={toggleCollapse}
            className="absolute -right-7 top-6 bg-slate-800 border border-white/20 rounded-full p-1 text-slate-400 hover:text-white transition-colors duration-200 z-10"
            aria-label={isCollapsed ? 'Expandir Sidebar' : 'Recolher Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

        {onClose && ( // Render close button only if onClose is provided (for mobile)
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        {navigationData.map(section => <NavSection key={section.title} section={section} isCollapsed={isCollapsed} />)}
      </nav>
      <div className={`pt-6 mt-6 border-t border-white/10 flex flex-col items-start ${isCollapsed ? 'items-center space-y-2' : 'space-y-4'}`}>
        {!isCollapsed && <span className="text-slate-400 text-sm whitespace-nowrap">Olá, {user?.user_metadata?.name || user?.email}</span>}
        <button
            onClick={handleLogout}
            className={`flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm ${isCollapsed ? 'w-full justify-center' : 'w-full justify-center'}`}
        >
            <LogOut className={`${isCollapsed ? 'mx-auto' : ''} w-4 h-4`} />
            {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};