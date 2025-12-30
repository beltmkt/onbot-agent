import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ResetPasswordModalProps {
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose }) => {
  const { updatePassword } = useAuth(); // Usará a nova função
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsUpdating(true);
    // @ts-ignore
    const { error } = await updatePassword(newPassword);

    if (error) {
      toast.error(`Erro ao redefinir a senha: ${error}`);
    } else {
      toast.success("Senha redefinida com sucesso!");
      onClose();
    }
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Redefinir Senha</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Digite sua nova senha"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Confirme sua nova senha"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isUpdating ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};
