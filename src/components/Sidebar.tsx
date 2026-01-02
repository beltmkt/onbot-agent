import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';
import { toast } from 'sonner';
import { navigationData, NavSectionType, NavItemType } from '../data/navigation.tsx';

const NavItem: React.FC<{ item: NavItemType }> = ({ item }) => {
  const { to, icon, text, disabled } = item;

  if (disabled) {
    return (
      <li className="nav-item disabled">
        <div className="nav-link">
          {icon}
          <span>{text}</span>
          <span className="coming-soon-badge">Em Breve</span>
        </div>
      </li>
    );
  }

  return (
    <li className="nav-item">
      <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        {icon}
        <span>{text}</span>
      </NavLink>
    </li>
  );
};

const NavSection: React.FC<{ section: NavSectionType }> = ({ section }) => (
  <div className="nav-section">
    <h3 className="nav-section-title">{section.title}</h3>
    <ul>
      {section.items.map(item => <NavItem key={item.to} item={item} />)}
    </ul>
  </div>
);

export const Sidebar: React.FC = () => {
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
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="text-xl font-bold text-white">Onboarding Tools</h1>
      </div>
      <nav>
        {navigationData.map(section => <NavSection key={section.title} section={section} />)}
      </nav>
      <div className="sidebar-footer">
        <span className="text-gray-300 text-sm">Olá, {user?.user_metadata?.name || user?.email}</span>
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
        >
            <LogOut className="w-4 h-4" />
            Sair
        </button>
      </div>
    </aside>
  );
};
