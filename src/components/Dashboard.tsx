import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Settings, MessageSquare, LogOut, Users, UserCheck, Clock, Zap, Shield, Star, Target, Rocket, Globe, Key, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TokenInput } from './TokenInput';
import { CSVUpload } from './CSVUpload';
import { OnBotChat } from './OnBotChat';
import { uploadCSVToN8N } from '../services/csvService';
import { auditService } from '../services/auditService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_email: string;
  action_type: string;
  file_name?: string;
  file_size?: number;
  status: string;
  created_at: string;
  error_message?: string;
}

type TabType = 'create-users' | 'teams' | 'settings' | 'system-logs' | 'activity-logs' | 'future1' | 'future2' | 'future3' | 'future4' | 'future5';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('create-users');
  const [token, setToken] = useState('');
  const [tokenConfirmed, setTokenConfirmed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Estados para configurações
  const [userName, setUserName] = useState(user?.user_metadata?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Estados para equipes
  const [teamToken, setTeamToken] = useState('');
  const [teamNames, setTeamNames] = useState('');

  // Estados para logs do usuário
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [loadingUserLogs, setLoadingUserLogs] = useState(false);

  // Verificar se usuário é admin
  const isAdmin = user?.email?.includes('alisson@c2sglobal.com') || false;

  // Carregar logs de auditoria apenas se for admin
  useEffect(() => {
    if (activeTab === 'system-logs' && isAdmin) {
      loadAuditLogs();
    }
    if (activeTab === 'activity-logs') {
      loadUserLogs();
    }
  }, [activeTab, isAdmin]);

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao carregar logs:', error);
        toast.error('Erro ao carregar logs de auditoria');
      } else {
        setAuditLogs(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadUserLogs = async () => {
    if (!user?.email) return;
    
    setLoadingUserLogs(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar logs do usuário:', error);
        toast.error('Erro ao carregar seus logs');
      } else {
        setUserLogs(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoadingUserLogs(false);
    }
  };

  const handleTokenConfirm = React.useCallback(() => {
    setTokenConfirmed(true);
  }, []);

  const handleFileUpload = React.useCallback(async (file: File) => {
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setFinished(false);
    setUploadMessage('Enviando arquivo para o servidor...');

    await auditService.logCSVUpload(
      user.email,
      user.id,
      file.name,
      file.size,
      'pending',
      undefined,
      { started_at: new Date().toISOString(), token: token }
    );

    try {
      const result = await uploadCSVToN8N(file, token);

      if (result.success) {
        setUploadMessage(`Arquivo processado com sucesso!`);
        toast.success('CSV enviado com sucesso!');

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'success',
          undefined,
          { completed_at: new Date().toISOString() }
        );
      } else {
        setUploadMessage(`Falha no envio do arquivo`);
        toast.error('Erro ao enviar CSV');

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'error',
          result.mensagem
        );
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadMessage('Erro de conexão. Tente novamente.');
      toast.error('Erro de conexão');

      await auditService.logCSVUpload(
        user.email,
        user.id,
        file.name,
        file.size,
        'error',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    } finally {
      setIsUploading(false);
      setFinished(true);
    }
  }, [user, token, setSelectedFile, setIsUploading, setFinished, setUploadMessage]);

  const handleRemoveFile = React.useCallback(() => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadMessage(null);
    setFinished(false);
  }, [setSelectedFile, setIsUploading, setUploadMessage, setFinished]);

  const handleFinishAndHome = React.useCallback(() => {
    handleRemoveFile();
    setTokenConfirmed(false);
    setToken('');
  }, [handleRemoveFile, setTokenConfirmed, setToken]);

  const handleUpdateProfile = React.useCallback(async () => {
    if (!user) return;

    setUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: userEmail,
        data: { name: userName }
      });

      if (error) {
        toast.error('Erro ao atualizar perfil: ' + error.message);
      } else {
        toast.success('Perfil atualizado com sucesso!');

        // Log da ação
        await auditService.createLog({
          userEmail: user.email!,
          actionType: 'profile_update',
          status: 'success',
          metadata: { updated_fields: ['name', 'email'] }
        });
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setUpdatingProfile(false);
    }
  }, [user, userEmail, userName, setUpdatingProfile]);

  const handleLogout = React.useCallback(async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  }, [logout]);

  const tabs = React.useMemo(() => [
    { id: 'create-users' as TabType, label: 'Criar Usuários', icon: Users, active: true },
    { id: 'teams' as TabType, label: 'Criar Equipe', icon: UserCheck, active: true },
    { id: 'logs' as TabType, label: 'Logs', icon: Activity, active: true },
    { id: 'settings' as TabType, label: 'Configurações', icon: Settings, active: true },
    ...(isAdmin ? [{ id: 'system-logs' as TabType, label: 'Logs do Sistema', icon: Activity, active: true }] : []),
    { id: 'future1' as TabType, label: 'Futuro 1', icon: Zap, active: false },
    { id: 'future2' as TabType, label: 'Futuro 2', icon: Shield, active: false },
    { id: 'future3' as TabType, label: 'Futuro 3', icon: Star, active: false },
    { id: 'future4' as TabType, label: 'Futuro 4', icon: Target, active: false },
    { id: 'future5' as TabType, label: 'Futuro 5', icon: Rocket, active: false },
  ], [isAdmin]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'create-users':
        return (
          <div className="space-y-8">
            {!tokenConfirmed ? (
              <TokenInput
                token={token}
                onTokenChange={setToken}
                onConfirm={handleTokenConfirm}
              />
            ) : (
              <CSVUpload
                onFileSelect={handleFileUpload}
                onBack={() => setTokenConfirmed(false)}
                onRemoveFile={handleRemoveFile}
                onFinishAndHome={handleFinishAndHome}
                selectedFile={selectedFile}
                isUploading={isUploading}
                uploadMessage={uploadMessage}
                finished={finished}
                token={token}
                companyId="C2S"
              />
            )}
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Gerenciamento de Equipes</h2>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token de Acesso
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><Key className="w-5 h-5" /></span>
                    <input
                      type="text"
                      value={teamToken}
                      onChange={(e) => setTeamToken(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Digite o token de acesso"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nomes das Equipes
                  </label>
                  <textarea
                    value={teamNames}
                    onChange={(e) => setTeamNames(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Digite os nomes das equipes, um por linha"
                  />
                </div>

                <button
                  disabled
                  className="w-full bg-gray-600 cursor-not-allowed text-gray-400 px-4 py-3 rounded-lg font-medium"
                >
                  Salvar (Em breve)
                </button>
              </div>
            </div>
          </div>
        );

      case 'activity-logs':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Meus Logs de Atividade</h2>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              {loadingUserLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <span className="ml-3 text-gray-400">Carregando logs...</span>
                </div>
              ) : userLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum log de atividade encontrado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userLogs.map((log) => (
                    <div key={log.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              log.status === 'success' ? 'bg-green-500/20 text-green-400' :
                              log.status === 'error' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {log.status === 'success' ? 'Sucesso' : log.status === 'error' ? 'Erro' : 'Pendente'}
                            </span>
                            <span className="text-gray-400 text-sm">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-white font-medium capitalize">
                            {log.action_type.replace('_', ' ')}
                          </p>
                          {log.file_name && (
                            <p className="text-gray-400 text-sm">
                              Arquivo: {log.file_name} ({log.file_size ? `${(log.file_size / 1024).toFixed(1)} KB` : 'Tamanho desconhecido'})
                            </p>
                          )}
                          {log.error_message && (
                            <p className="text-red-400 text-sm mt-1">
                              Erro: {log.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Configurações do Perfil</h2>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><UserCheck className="w-5 h-5" /></span>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Digite seu nome"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><Mail className="w-5 h-5" /></span>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Digite seu e-mail"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={updatingProfile}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {updatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'system-logs':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Logs do Sistema</h2>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Data/Hora</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuário</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Ação</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {log.user_email}
                          </td>
                          <td className="py-3 px-4 text-gray-300 capitalize">
                            {log.action_type.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === 'success' ? 'bg-green-500/20 text-green-400' :
                              log.status === 'error' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">
                            {log.error_message || log.file_name || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</h2>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">Em Breve</h3>
                <p className="text-gray-400">Esta funcionalidade estará disponível em breve.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Onboarding Tools</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">Olá, {user?.user_metadata?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.active && setActiveTab(tab.id)}
                  disabled={!tab.active}
                  className={`flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-400'
                      : tab.active
                      ? 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                      : 'border-transparent text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* OnBot Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed right-6 bottom-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg transition-all z-50 flex items-center gap-2 group hover:scale-105"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
          OnBot Chat
        </span>
      </button>

      {/* OnBot Chat Modal */}
      {showChat && (
        <OnBotChat onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};
