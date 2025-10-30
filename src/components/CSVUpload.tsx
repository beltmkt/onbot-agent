import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Loader2,
  Download,
  CheckCircle,
  XCircle,
  KeyRound,
  Lock, // NOVO: Ícone de bloqueio
  Check, // NOVO: Ícone de concluído
} from 'lucide-react';

interface CSVUploadProps {
  companyId: string;
}

// NOVO: Etapas mais claras para a UI unificada
type UploadStep = 'token' | 'csv' | 'uploading' | 'finished';

export const CSVUpload = ({ companyId }: CSVUploadProps) => {
  const [token, setToken] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // O "step" controla qual parte da UI está ativa
  const [step, setStep] = useState<UploadStep>('token');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile || !token || !companyId) {
      setStep('finished');
      setIsSuccess(false);
      setMessage('❌ Faltam dados (Token, CSV ou Company ID).');
      return;
    }

    setStep('uploading');
    setMessage('⏳ Enviando e iniciando o processamento...');
    setIsSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('company_id', companyId);
      
      const response = await fetch(
        'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok && (result.message === 'Workflow was started' || result.message?.includes('sucesso'))) {
        setIsSuccess(true);
        setMessage('✅ Processamento iniciado com sucesso!');
      } else {
        setIsSuccess(false);
        setMessage(result.error || result.message || '❌ Falha no processamento');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setIsSuccess(false);
      setMessage('❌ Erro de conexão. Tente novamente.');
    } finally {
      setStep('finished');
    }
  };

  const processFileSelection = (file: File | undefined) => {
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setMessage('⚠️ Selecione um arquivo CSV válido.');
      setIsSuccess(false);
      setStep('finished'); // Manda para tela de erro
      return;
    }
    setSelectedFile(file);
    setMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFileSelection(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFileSelection(e.dataTransfer.files?.[0]);
  };

  const handleReset = () => {
    window.location.reload();
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ===================================
  // RENDERIZAÇÃO PRINCIPAL
  // ===================================

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* ✅ Card MAIOR */}
      <div className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-[#1f1f1f] rounded-2xl shadow-lg p-8 max-w-2xl w-full backdrop-blur-sm">

        {/* Título Fixo */}
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-wide">
          <span className="text-blue-500 font-bold">C2S</span> – Create Sellers
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Siga as etapas para criar vendedores em massa.
        </p>

        {/* ======================================= */}
        {/* ETAPA FINAL (SUCESSO OU ERRO)         */}
        {/* ======================================= */}
        {step === 'finished' ? (
          <div className="p-6 bg-black/40 border-gray-700/50 rounded-2xl flex flex-col items-center gap-4 min-h-[300px] justify-center">
            {isSuccess ? (
              <CheckCircle className="w-12 h-12 text-green-400" />
            ) : (
              <XCircle className="w-12 h-12 text-red-400" />
            )}
            <p className={`text-white font-medium text-lg ${!isSuccess ? 'text-red-300' : ''}`}>
              {message}
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Fazer novo envio
            </button>
          </div>
        ) : (
          
        /* ======================================= */
        /* WIZARD DE 2 ETAPAS (TOKEN E CSV)      */
        /* ======================================= */
          <div className="space-y-6">

            {/* --- ETAPA 1: TOKEN --- */}
            <div className={`
              p-6 bg-black/30 border border-gray-800 rounded-xl transition-all
              ${step !== 'token' ? 'opacity-50 pointer-events-none' : ''}
            `}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-medium text-white">Etapa 1: Token</h3>
                </div>
                {step !== 'token' && (
                  <Check className="w-5 h-5 text-green-400" />
                )}
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole seu token de autenticação aqui"
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* --- ETAPA 2: CSV --- */}
            <div className={`
              p-6 bg-black/30 border border-gray-800 rounded-xl transition-all
              ${step === 'token' ? 'opacity-50 pointer-events-none' : ''}
            `}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full 
                    ${step === 'token' ? 'bg-gray-700/50 text-gray-500' : 'bg-blue-500/20 text-blue-400'}
                  `}>
                    {step === 'token' ? <Lock className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  </div>
                  <h3 className={`text-lg font-medium ${step === 'token' ? 'text-gray-600' : 'text-white'}`}>
                    Etapa 2: Planilha CSV
                  </h3>
                </div>
                {selectedFile && (
                  <Check className="w-5 h-5 text-green-400" />
                )}
              </div>
              
              {/* Link de Download */}
              <a
                href="https://docs.google.com/spreadsheets/d/1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo/export?format=csv&id=1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo&gid=0"
                download="modelo_c2s.csv"
                className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 border border-gray-600 rounded-lg text-xs text-blue-400 bg-transparent hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
              >
                <Download className="w-3 h-3" />
                Baixar modelo CSV
              </a>

              {/* Uploader */}
              {!selectedFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={step === 'token' ? -1 : 0} // Desabilita do Tab
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300
                    ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-black/40 hover:border-blue-500/50 hover:bg-blue-500/5'}
                  `}
                >
                  <p className="text-sm font-medium text-white">
                    {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo CSV'}
                  </p>
                  <input
                    ref={fileInputRef} type="file" accept=".csv,text/csv"
                    onChange={handleFileChange} className="hidden"
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
                  <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button onClick={handleRemoveFile} className="text-gray-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* --- BOTÃO DE AÇÃO PRINCIPAL --- */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              
              {/* Botão da Etapa 1 */}
              {step === 'token' && (
                <button
                  onClick={() => setStep('csv')}
                  disabled={!token.trim()}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Token
                </button>
              )}
              
              {/* Botão da Etapa 2 */}
              {step === 'csv' && (
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !token.trim()}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar e Iniciar Processo
                </button>
              )}
              
              {/* Loader */}
              {step === 'uploading' && (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium cursor-not-allowed"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CSVUpload;