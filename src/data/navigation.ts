import React from 'react';
import { 
  Home, Users, ArrowRightLeft, 
  Archive, UserPlus, History, Settings 
} from 'lucide-react';

export interface NavItemType {
  to: string;
  icon: React.ReactNode;
  text: string;
  disabled?: boolean;
}

export interface NavSectionType {
  title: string;
  items: NavItemType[];
}

export const navigationData: NavSectionType[] = [
  {
    title: 'OPERACIONAL',
    items: [
      { to: '/home', icon: <Home size={20} />, text: 'Início' },
      { to: '/create-users', icon: <Users size={20} />, text: 'Criar Usuários' },
      { to: '/transfer-contacts', icon: <ArrowRightLeft size={20} />, text: 'Transferir Contatos' },
    ],
  },
  {
    title: 'EM BREVE',
    items: [
      { to: '/teams', icon: <UserPlus size={20} />, text: 'Criar Equipes', disabled: true },
      { to: '/remax-requests', icon: <Archive size={20} />, text: 'Solicitações Remax', disabled: true },
    ],
  },
  {
    title: 'ADMINISTRATIVO',
    items: [
      { to: '/audit', icon: <History size={20} />, text: 'Auditoria' },
      { to: '/settings', icon: <Settings size={20} />, text: 'Configurações' },
    ],
  },
];
