import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, Download, CheckCircle } from 'lucide-react';

interface CSVUploadProps {
  token: string;
  companyId: string;
  onFileSelect?: (file: File) => void;
}

export const CSVUpload = ({ token, companyId, onFileSelect }: CSVUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!token) {
      setUploadMessage('⚠️ Insira o token antes de enviar o CSV.');
      return;
    }
    setIsUploading(true);
    setUploadMessage('⏳ Enviando arquivo...');
    setFinished(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_name', file.name);
      formData.append('file_size', file.size.toString());
      formData.append('uploaded_at', new Date().toISOString());

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
        setUploadMessage(`✅ ${result.message || 'Arquivo processado com sucesso!'}`);
      } else {
        setUploadMessage(`❌ Erro: ${result.error || 'Falha no processamento'}`);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setUploadMessage('❌ Erro de conexão. Tente novamente.');
    } finally {
      setIsUploading(false);
      setFinished(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      onFileSelect?.(file);
      handleUpload(file);
    } else {
      setUploadMessage('⚠️ Selecione um arquivo CSV válido.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      onFileSelect?.(file);
      handleUpload(file);
    } else {
      setUploadMessage('⚠️ Arquivo inválido.');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadMessage(null);
    setFinished(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="bg-gradient-to-tr from-[#0f0f0f] via-[#111111] to-[#1a1a1a] border border-gray-800 rounded-3xl shadow-2xl p-10 max-w-lg w-full backdrop-blur-md">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-3 tracking-wide">
          C2S – Create Sellers
        </h2>

        <p className="text-gray-400 text-sm mb-4">
          Envie sua planilha CSV para criar vendedores automaticamente.
        </p>

        <a
          href="https://docs.google.com/spreadsheets/d/1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo/export?format=csv&id=1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo&gid=0"
          download="modelo_c2s.csv"
          className="inline-flex items-center gap-2 px-5 py-2 border border-gray-600 rounded-lg text-xs text-blue-400 bg-transparent hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-300"
        >
          <Download className="w-4 h-4" />
          Baixar modelo CSV
        </a>

        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                : 'border-gray-700 bg-gray-900/40 hover:border-blue-500/50 hover:bg-blue-500/5'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-14 h-14 text-blue-400" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-white">
                {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo CSV'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                O token e o company ID serão incluídos automaticamente.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : finished ? (
          <div className="p-6 bg-gray-900/60 border border-blue-500/30 rounded-2xl flex flex-col items-center gap-4 animate-fadeIn">
            <CheckCircle className="w-14 h-14 text-green-400 animate-bounce" />
            <p className="text-white font-medium text-lg">{uploadMessage}</p>
            <button
              onClick={handleRemoveFile}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-md transition-all duration-300"
            >
              🔄 Fazer nova ação
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/5 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-md">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB • CSV
                </p>
                {isUploading ? (
                  <p className="text-xs text-blue-400 mt-1 flex items-center gap-2 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                  </p>
                ) : (
                  <p className="text-xs text-green-400 mt-1">✅ Upload completo</p>
                )}
              </div>
              <button
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadMessage && (
              <div
                className={`p-3 rounded-xl border ${
                  uploadMessage.includes('✅')
                    ? 'border-green-500/40 bg-green-500/10 text-green-300'
                    : uploadMessage.includes('❌')
                    ? 'border-red-500/40 bg-red-500/10 text-red-300'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300'
                } transition-all duration-300`}
              >
                <p className="text-sm">{uploadMessage}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVUpload;
