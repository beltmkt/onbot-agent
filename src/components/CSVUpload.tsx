import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, Download, CheckCircle, Cloud, Cpu, Zap } from 'lucide-react';

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

  // 🔧 SUAS FUNÇÕES ORIGINAIS (MANTIDAS) 🔧
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

  // 🎨 NOVO FRONT-END MODERNO E TECNOLÓGICO 🎨
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* 🚀 Header Tecnológico */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl">
                    <Cpu className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      C2S PLATFORM
                    </h1>
                    <p className="text-gray-400 text-sm">Create Sellers System</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Sistema inteligente de importação em massa para criação automatizada de vendedores
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 Painel Principal */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Header do Card */}
              <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Cloud className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Upload de Dados</h2>
                      <p className="text-gray-400 text-sm">Processamento em tempo real</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-300">Sistema Online</span>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-8">
                {!selectedFile ? (
                  // 🎯 Área de Upload
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-500 group ${
                      isDragging
                        ? 'border-cyan-400 bg-cyan-500/10 scale-105'
                        : 'border-gray-700 bg-gray-800/20 hover:border-blue-400 hover:bg-blue-500/5 hover:scale-[1.02]'
                    }`}
                  >
                    {/* Efeitos de Fundo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                        <Upload className="w-16 h-16 text-blue-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      
                      <div className="text-center space-y-2">
                        <p className="text-xl font-semibold text-white">
                          {isDragging ? '📥 Solte o arquivo aqui' : '📁 Arraste ou clique para upload'}
                        </p>
                        <p className="text-gray-400 text-sm max-w-md">
                          Sistema otimizado para processamento de arquivos CSV com validação automática
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Zap className="w-4 h-4" />
                          <span>Processamento Rápido</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle className="w-4 h-4" />
                          <span>Validação Automática</span>
                        </div>
                      </div>
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
                  // ✅ Tela de Finalização
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                      <CheckCircle className="w-24 h-24 text-green-400 relative z-10 animate-bounce" />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-white">Processamento Concluído!</h3>
                      <p className="text-gray-300 text-lg">{uploadMessage}</p>
                      
                      <button
                        onClick={handleRemoveFile}
                        className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                      >
                        🔄 Nova Importação
                      </button>
                    </div>
                  </div>
                ) : (
                  // 📁 Arquivo Selecionado
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-400/5 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                          <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-white font-semibold truncate text-lg">{selectedFile.name}</p>
                            <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full border border-gray-700">
                              CSV
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{(selectedFile.size / 1024).toFixed(2)} KB</span>
                            <span>•</span>
                            <span>Última modificação: {new Date(selectedFile.lastModified).toLocaleDateString('pt-BR')}</span>
                          </div>

                          {isUploading && (
                            <div className="mt-3 flex items-center gap-2 text-blue-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Processando dados...</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={handleRemoveFile}
                          disabled={isUploading}
                          className="p-3 text-gray-400 hover:text-red-400 transition-all duration-300 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 disabled:opacity-50"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso Visual */}
                    {isUploading && (
                      <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full animate-pulse"></div>
                      </div>
                    )}

                    {uploadMessage && (
                      <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                        uploadMessage.includes('✅')
                          ? 'border-green-500/40 bg-green-500/10 text-green-300'
                          : uploadMessage.includes('❌')
                          ? 'border-red-500/40 bg-red-500/10 text-red-300'
                          : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          {uploadMessage.includes('✅') && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                          {uploadMessage.includes('❌') && <X className="w-5 h-5 flex-shrink-0" />}
                          <p className="text-sm font-medium">{uploadMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 📋 Sidebar Informativa */}
          <div className="space-y-6">
            {/* Template Download */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                Template Oficial
              </h3>
              
              <a
                href="https://docs.google.com/spreadsheets/d/1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo/export?format=csv&id=1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo&gid=0"
                download="modelo_c2s.csv"
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-400/5 border border-blue-500/20 rounded-xl text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all duration-300 group"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Baixar Modelo CSV</span>
              </a>
              
              <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-2">📋 Estrutura do Arquivo:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Colunas: nome, email, empresa</li>
                  <li>• Encoding: UTF-8</li>
                  <li>• Delimitador: Vírgula</li>
                  <li>• Cabeçalho obrigatório</li>
                </ul>
              </div>
            </div>

            {/* Status do Sistema */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Status do Sistema</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">API Connection</span>
                  <span className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Online
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Processamento</span>
                  <span className="text-blue-400">Ativo</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Company ID</span>
                  <span className="text-cyan-400 font-mono">{companyId}</span>
                </div>
              </div>
            </div>

            {/* Dicas Rápidas */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">💡 Dicas Rápidas</h3>
              
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Arquivos são processados em segundos</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Validação automática de formato</span>
                </div>
                <div className="flex items-start gap-2">
                  <Cloud className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Dados criptografados em trânsito</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUpload;