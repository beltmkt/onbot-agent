import { Database } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="flex items-center gap-3 mb-12">
      <div className="relative">
        <Database className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
        <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 animate-pulse"></div>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          C<span className="text-blue-400">2</span>S CreateSeller
        </h1>
        <p className="text-sm text-gray-400 font-light">
          Conectando empresas, equipes e pessoas com automação inteligente.
        </p>
      </div>
    </div>
  );
};
