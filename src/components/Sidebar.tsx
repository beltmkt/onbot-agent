import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Users, LogOut, UserPlus, ArrowRightLeft, 
  Archive, DollarSign, AreaChart, History, Settings 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';
import { toast } from 'sonner';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; children: React.ReactNode; disabled?: boolean }> = ({ to, icon, children, disabled }) => {
  if (disabled) {
    return (
      <li className="nav-item disabled">
        <div className="nav-link">
          {icon}
          <span>{children}</span>
          <span className="coming-soon-badge">Em Breve</span>
        </div>
      </li>
    );
  }

  return (
    <li className="nav-item">
      <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        {icon}
        <span>{children}</span>
      </NavLink>
    </li>
  );
};

const NavSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="nav-section">
    <h3 className="nav-section-title">{title}</h3>
    <ul>{children}</ul>
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
        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Onboarding Tools</h1>
      </div>
      <nav>
        <NavSection title="OPERACIONAL">
          <NavItem to="/home" icon={<Home size={20} />}>Início</NavItem>
          <NavItem to="/create-users" icon={<Users size={20} />}>Criar Usuários</NavItem>
          <NavItem to="/teams" icon={<UserPlus size={20} />}>Criar Equipes</NavItem>
          <NavItem to="/transfer-contacts" icon={<ArrowRightLeft size={20} />}>Transferir Contatos</NavItem>
        </NavSection>

        <NavSection title="FUTURO">
          <NavItem to="#" icon={<Archive size={20} />} disabled>Solicitações Remax</NavItem>
          <NavItem to="#" icon={<DollarSign size={20} />} disabled>Integração Financeira</NavItem>
          <NavItem to="#" icon={<AreaChart size={20} />} disabled>Dashboards Avançados</NavItem>
        </NavSection>

        <NavSection title="ADMINISTRATIVO">
          <NavItem to="/audit" icon={<History size={20} />}>Auditoria</NavItem>
          <NavItem to="/settings" icon={<Settings size={20} />}>Configurações</NavItem>
        </NavSection>
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
