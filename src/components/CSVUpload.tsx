import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Loader2,
  Download,
  CheckCircle,
  XCircle,
  ArrowRight,
  KeyRound, // NOVO: Ícone para Token
  ArrowLeft, // NOVO: Ícone para Voltar
} from 'lucide-react';

interface CSVUploadProps {
  // O Token foi removido das props,
  // pois agora é gerenciado dentro do componente.
  companyId: string;
}

// NOVO: Mais etapas para o novo fluxo
type UploadStatus =
  | 'token' // Etapa 1: Pedir o Token
  | 'csv_idle' // Etapa 2: Pedir o CSV
  | 'csv_selected' // Etapa 2: CSV selecionado, pronto para enviar
  | 'uploading' // Etapa 3: Enviando
  | 'finished'; // Etapa 4: Concluído (sucesso ou erro)

export const CSVUpload = ({ companyId }: CSVUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // NOVO: O token agora é um estado interno
  const [token, setToken] = useState('');

  // NOVO: Gerenciador de estado principal
  const [status, setStatus] = useState<UploadStatus>('token');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); // Para a tela final

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile || !token || !companyId) {
      setStatus('finished');
      setIsSuccess(false);
      setMessage('❌ Faltam dados (Token, CSV ou Company ID).');
      return;
    }

    setStatus('uploading');
    setMessage('⏳ Enviando e iniciando o processamento...');
    setIsSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('file_name', selectedFile.name);
      formData.append('file_size', selectedFile.size.toString());
      formData.append('uploaded_at', new Date().toISOString());
      formData.append('company_id', companyId);

      const response = await fetch(
        'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final',
        {
          method: 'POST',
          // O token do estado é usado aqui
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const result = await response.json();

      // ✅ LÓGICA DO N8N: Tratar "Workflow started" como sucesso
      if (response.ok && (result.message === 'Workflow was started' || result.message?.includes('sucesso'))) {
        setIsSuccess(true);
        setMessage('✅ Processamento iniciado com sucesso!');
      } else {
        setIsSuccess(false);
        setMessage(result.error || '❌ Falha no processamento');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setIsSuccess(false);
      setMessage('❌ Erro de conexão. Tente novamente.');
    } finally {
      setStatus('finished'); // Mover para a tela final
    }
  };

  const processFileSelection = (file: File | undefined) => {
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setMessage('⚠️ Selecione um arquivo CSV válido.');
      setIsSuccess(false);
      setStatus('finished'); // Manda para tela de erro
      return;
    }

    setSelectedFile(file);
    setStatus('csv_selected'); // Apenas seleciona, não faz upload
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

  // ✅ NOVO: Ação do botão "Novo Envio"
  const handleReset = () => {
    // Recarrega a página, como solicitado
    window.location.reload();
  };
  
  // Limpa apenas o arquivo, para voltar ao dropzone
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage(null);
    setStatus('csv_idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  // Volta para a etapa do token
  const handleBackToToken = () => {
    setStatus('token');
    setMessage(null);
  }

  // ===================================
  // RENDERIZAÇÃO EM ETAPAS
  // ===================================

  const renderContent = () => {
    // =======================================
    // ETAPA 1: INSERIR TOKEN
    // =======================================
    if (status === 'token') {
      return (
        <div className="w-full">
          <div className="flex flex-col items-center gap-3 mb-6">
            <KeyRound className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
            <p className="text-sm font-medium text-white">
              Insira seu Token de Autenticação
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole seu token aqui"
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setStatus('csv_idle')}
              disabled={!token.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Avançar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // =======================================
    // ETAPA 2: UPLOAD DO CSV
    // =======================================
    if (status === 'csv_idle' || status === 'csv_selected') {
      return (
        <div className="w-full">
          {/* Botão de Voltar */}
          <button 
            onClick={handleBackToToken}
            className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 border border-gray-700 rounded-lg text-xs text-gray-400 bg-transparent hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </button>
        
          {/* Dropzone */}
          {status === 'csv_idle' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-black/40 hover:border-blue-500/50 hover:bg-blue-500/5'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
                <p className="text-sm font-medium text-white">
                  {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo CSV'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Etapa 2 de 2: Selecionar planilha
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
          
          {/* Arquivo Selecionado e Botão de Envio */}
          {status === 'csv_selected' && selectedFile && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
                <FileText className="w-6 h-6 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ✅ O "Botão Único" que envia tudo */}
              <button
                onClick={handleUpload}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Enviar CSV e Iniciar Processo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      );
    }
    
    // =======================================
    // ETAPA 3: CARREGANDO
    // =======================================
    if (status === 'uploading') {
       return (
         <div className="p-6 bg-black/40 border border-blue-500/30 rounded-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="text-white font-medium text-lg">
              {message || 'Enviando...'}
            </p>
         </div>
       );
    }

    // =======================================
    // ETAPA 4: CONCLUÍDO (SUCESSO OU ERRO)
    // =======================================
    if (status === 'finished') {
      return (
        <div className="p-6 bg-black/40 border-gray-700/50 rounded-2xl flex flex-col items-center gap-4">
          {isSuccess ? (
            <CheckCircle className="w-12 h-12 text-green-400" />
          ) : (
            <XCircle className="w-12 h-12 text-red-400" />
          )}

          <p className={`text-white font-medium text-lg ${
              !isSuccess ? 'text-red-300' : ''
            }`}>
            {message}
          </p>

          {/* ✅ Botão de Reset que recarrega a página */}
          <button
            onClick={handleReset}
            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Fazer novo envio
          </button>
        </div>
      );
    }
    
    return null; // Caso de fallback
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-[#1f1f1f] rounded-2xl shadow-lg p-8 max-w-lg w-full backdrop-blur-sm">
        
        {/* O Título e o link de Download agora são fixos */}
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-wide">
          <span className="text-blue-500 font-bold">C2S</span> – Create Sellers
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {status === 'token'
            ? 'Bem-vindo! Insira seu token para começar.'
            : 'Siga as etapas para criar vendedores.'
          }
        </p>

        {/* Link de Download só aparece na etapa do CSV */}
        {(status === 'csv_idle' || status === 'csv_selected') && (
            <p className="mb-8">
              <a
                href="https://docs.google.com/spreadsheets/d/1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo/export?format=csv&id=1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo&gid=0"
                download="modelo_c2s.csv"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-xs text-blue-400 bg-transparent hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar modelo CSV
              </a>
            </p>
        )}

        {/* O conteúdo dinâmico é renderizado aqui */}
        <div className="min-h-[150px] flex items-center justify-center">
          {renderContent()}
        </div>
        
      </div>
    </div>
  );
};

export default CSVUpload;