import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ResetPasswordModal } from './ResetPasswordModal';
import { SuggestionForm } from './SuggestionForm'; // Importa o novo componente

const phoneMask = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g,'');
  v = v.replace(/^(\d{2})(\d)/g,"($1) $2");
  v = v.replace(/(\d{5})(\d)/,"$1-$2");
  return v.slice(0, 15);
}

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.name || '');
      setEmail(user.email || '');
      setPhone(phoneMask(user.user_metadata?.phone || ''));
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { error } = await updateUser({
      name: fullName,
      phone: phone.replace(/\D/g, ''),
    });

    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.success('Perfil atualizado com sucesso!');
    }
    setIsSaving(false);
  };

  return (
    <>
      <div className="p-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-white">Configurações</h1>
        
        {/* Formulário de Perfil */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg max-w-md">
          <h2 className="text-xl font-bold mb-4 text-white">Meu Perfil</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
              <input 
                type="text" 
                id="fullName" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                placeholder="Seu nome completo" 
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                readOnly
                className="w-full pl-4 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
              <input 
                type="text" 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(phoneMask(e.target.value))} 
                maxLength={15} 
                className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                placeholder="(99) 99999-9999" 
              />
            </div>
            <div className="pt-2 space-y-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsResetModalOpen(true)}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Redefinir Senha
              </button>
            </div>
          </form>
        </div>

        {/* Formulário de Sugestão */}
        <SuggestionForm />

      </div>
      {isResetModalOpen && <ResetPasswordModal onClose={() => setIsResetModalOpen(false)} />}
    </>
  );
};
