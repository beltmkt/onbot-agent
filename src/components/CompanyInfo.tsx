export const CompanyInfo = ({ companyName, teamCount }: { companyName: string; teamCount: number }) => {
  const isProcessing = companyName.includes('Processando');
  
  return (
    <div className={`bg-gradient-to-br backdrop-blur-xl border rounded-2xl p-6 ${
      isProcessing 
        ? 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/30' 
        : 'from-green-500/10 to-green-600/10 border-green-500/30'
    }`}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        {isProcessing ? '⏳' : '✅'} 
        <span className={isProcessing ? 'text-yellow-400' : 'text-green-400'}>
          {companyName}
        </span>
      </h3>
      <div className="space-y-2">
        <p className={isProcessing ? 'text-yellow-300' : 'text-green-300'}>
          <strong>Equipes:</strong> {teamCount}
        </p>
        {isProcessing && (
          <p className="text-yellow-400 text-xs">
            ⚠️ Validação em andamento... Você já pode fazer upload da planilha.
          </p>
        )}
      </div>
    </div>
  );
};