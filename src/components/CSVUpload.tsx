import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Loader2,
  Download,
  CheckCircle,
  XCircle, // NOVO: Ícone de erro
  ArrowRight, // NOVO: Ícone para o botão
} from 'lucide-react';

interface CSVUploadProps {
  token: string;
  companyId: string;
  onFileSelect?: (file: File) => void;
}

// NOVO: Um tipo para controlar o estado da UI de forma limpa
type UploadStatus = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export const CSVUpload = ({ token, companyId, onFileSelect }: CSVUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // NOVO: Estados refatorados
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validação centralizada
  const validateFile = (file: File | undefined): file is File => {
    if (!file) return false;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setStatus('error');
      setMessage('⚠️ Selecione um arquivo CSV válido.');
      return false;
    }
    
    // NOVO: Checagem de token
    if (!token) {
      setStatus('error');
      setMessage('⚠️ Insira o token antes de enviar o CSV.');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setMessage('⏳ Enviando arquivo...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('file_name', selectedFile.name);
      formData.append('file_size', selectedFile.size.toString());
      formData.append('uploaded_at', new Date().toISOString());
      
      // ✅ CORREÇÃO: companyId estava faltando
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

      if (response.ok) {
        setStatus('success');
        setMessage(result.message || 'Arquivo processado com sucesso!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Falha no processamento');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setStatus('error');
      setMessage('❌ Erro de conexão. Tente novamente.');
    }
  };

  const processFileSelection = (file: File | undefined) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    onFileSelect?.(file);
    setStatus('selected'); // NOVO: Apenas seleciona, não faz upload
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage(null);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Funções de Acessibilidade
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-[#1f1f1f] rounded-2xl shadow-lg p-8 max-w-lg w-full backdrop-blur-sm">
        {/* ... Título e link de download (sem alterações) ... */}
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-wide">
           <span className="text-blue-500 font-bold">C2S</span> – Create Sellers
         </h2>
         <p className="text-gray-400 text-sm mb-2">
           Envie sua planilha CSV para criar vendedores automaticamente.
         </p>
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

        {/* ======================================= */}
        {/* 1. ESTADO INICIAL (IDLE) - Dropzone     */}
        {/* ======================================= */}
        {status === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            // NOVO: Acessibilidade
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-black/40 hover:border-blue-500/50 hover:bg-blue-500/5'
            }`}
          >
            {/* ... Conteúdo do Dropzone (sem alterações) ... */}
            <div className="flex flex-col items-center gap-3">
               <Upload className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
               <p className="text-sm font-medium text-white">
                 {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo CSV'}
               </p>
               <p className="text-xs text-gray-500 mt-1">
                 O token e o company ID serão incluídos automaticamente.
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
        
        {/* =================================================== */}
        {/* 2. ESTADO SELECIONADO OU EM UPLOAD (File Info)    */}
        {/* =================================================== */}
        {(status === 'selected' || status === 'uploading') && selectedFile && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB • CSV
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                disabled={status === 'uploading'}
                className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* NOVO: Botão de Upload (UX melhorada) */}
            {status === 'selected' && (
              <button
                onClick={handleUpload}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Iniciar Envio <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* NOVO: Indicador de Upload */}
            {status === 'uploading' && (
              <div className="p-3 rounded-lg border border-gray-700 bg-black/40 text-gray-300 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">{message || 'Enviando...'}</p>
              </div>
            )}
          </div>
        )}
        
        {/* =================================================== */}
        {/* 3. ESTADO FINAL (Success ou Error)                */}
        {/* =================================================== */}
        {(status === 'success' || status === 'error') && (
          <div className="p-6 bg-black/40 border border-blue-500/30 rounded-2xl flex flex-col items-center gap-4">
            
            {/* ✅ LÓGICA CORRIGIDA: Mostra ícone Certo */}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-400" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-400" />
            )}
            
            <p className={`text-white font-medium text-lg ${
              status === 'error' ? 'text-red-300' : ''
            }`}>
              {message}
            </p>

            <button
              onClick={handleRemoveFile}
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              🔄 Fazer novo envio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVUpload;