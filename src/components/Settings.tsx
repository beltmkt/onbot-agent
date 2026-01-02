import React, { useState } from 'react';
import { ResetPasswordModal } from './ResetPasswordModal';
import { SuggestionForm } from './SuggestionForm';
import { ProfileForm } from './ProfileForm'; // Importa o novo componente de perfil
import { User, MessageSquareHeart } from 'lucide-react';

type Tab = 'profile' | 'suggestion';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileForm onResetPassword={() => setIsResetModalOpen(true)} />;
      case 'suggestion':
        return <SuggestionForm />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tabName: Tab, label: string, icon: React.ReactNode}> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        activeTab === tabName
          ? 'bg-gray-800/60 border-b-2 border-cyan-500 text-white'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      <div className="p-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-white">Configurações</h1>
        
        <div className="max-w-md">
          {/* Navegação por Abas */}
          <div className="flex border-b border-gray-700 mb-6">
            <TabButton tabName="profile" label="Meu Perfil" icon={<User size={18} />} />
            <TabButton tabName="suggestion" label="Enviar Sugestão" icon={<MessageSquareHeart size={18} />} />
          </div>

          {/* Conteúdo da Aba */}
          {renderTabContent()}
        </div>
      </div>
      {isResetModalOpen && <ResetPasswordModal onClose={() => setIsResetModalOpen(false)} />}
    </>
  );
};
