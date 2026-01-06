import React, { useState, useRef } from 'react';
import { Sparkles, UserPlus, ArrowRightLeft, ClipboardList, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [commandInput, setCommandInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null); // Ref para o input
  const userName = "Alisson"; // Pode conectar com seu contexto real depois

  const handleCommandSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (commandInput.trim()) { // Only navigate if there's actual input
        navigate('/onbot-chat', { state: { initialPrompt: commandInput } });
        setCommandInput(''); // Clear input after submission
      } else {
        toast.info("Por favor, digite uma mensagem ou ação.");
      }
    }
  };

  const handleSparklesClick = () => {
    inputRef.current?.focus(); // Foca no input quando o ícone Sparkles é clicado
  };

  const handleCardClick = (path: string) => {
    if (path === '/audit') {
      toast.success('Sistemas online e funcionando!');
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* 1. Background Effects (Manual CSS p/ garantir que apareça) */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500 rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      {/* 2. Main Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center gap-12 text-center">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Olá, <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">{userName}</span>
          </h1>
          <p className="text-slate-400 text-xl font-light max-w-2xl mx-auto">
            Seu centro de comando está pronto. Qual automação vamos executar hoje?
          </p>
        </div>

        {/* 3. The Command Bar (Visual Key) */}
        <div className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl opacity-30 group-hover:opacity-70 blur transition duration-500"></div>
          <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div 
              className="mr-4 cursor-pointer hover:text-cyan-400 transition-colors duration-200" 
              onClick={handleSparklesClick}
            >
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <input 
              ref={inputRef} // Atribui a ref ao input
              type="text" 
              placeholder="Converse com o OnBot ou digite uma ação..." 
              className="w-full bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleCommandSubmit}
            />
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/10 text-xs text-slate-500 font-mono">
              <Command size={12} /> K
            </div>
          </div>
        </div>

        {/* 4. Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Card: Criar */}
          <div 
            className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-2xl transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => handleCardClick('/create-users')}
          >
            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <UserPlus className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-left">Crie usuários</h3>
            <p className="text-sm text-slate-400 text-left mt-1">Crie novos usuários no C2S</p>
          </div>

          {/* Card: Transferir */}
          <div 
            className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-2xl transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => handleCardClick('/transfer-contacts')}
          >
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <ArrowRightLeft className="text-cyan-400" />
            </div>
            <h3 className="lg font-semibold text-left">Transferir Contato</h3>
            <p className="text-sm text-slate-400 text-left mt-1">Transfira contatos no C2SGo</p>
          </div>

          {/* Card: Auditoria */}
          <div 
            className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 rounded-2xl transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => handleCardClick('/audit')}
          >
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <ClipboardList className="text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-left">Auditoria</h3>
            <p className="text-sm text-slate-400 text-left mt-1">Visualizar histórico de ações.</p>
          </div>
        </div>

      </div>
    </div>
  );
};