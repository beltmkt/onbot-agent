import React from 'react';
import { Sparkles, UserPlus, ArrowRightLeft, Activity, Command } from 'lucide-react';

// Se este for o componente principal, exporte como default
export const Home: React.FC = () => {
  const userName = "Alisson"; // Pode conectar com seu contexto real depois

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
            <Sparkles className="w-6 h-6 text-indigo-400 mr-4 animate-pulse" />
            <input 
              type="text" 
              placeholder="Digite 'Transferir' ou 'Criar'..." 
              className="w-full bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg"
            />
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/10 text-xs text-slate-500 font-mono">
              <Command size={12} /> K
            </div>
          </div>
        </div>

        {/* 4. Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Card: Criar */}
          <div className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-2xl transition-all cursor-pointer hover:-translate-y-1">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <UserPlus className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-left">Criar Usuário</h3>
            <p className="text-sm text-slate-400 text-left mt-1">Adicionar novo membro ao time.</p>
          </div>

          {/* Card: Transferir */}
          <div className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-2xl transition-all cursor-pointer hover:-translate-y-1">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <ArrowRightLeft className="text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-left">Transferir Lead</h3>
            <p className="text-sm text-slate-400 text-left mt-1">Mover contatos entre carteiras.</p>
          </div>

          {/* Card: Status */}
          <div className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-2xl transition-all cursor-pointer hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Activity className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-left">Sistemas</h3>
            <p className="text-sm text-slate-400 text-left mt-1">Todos os serviços online.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
