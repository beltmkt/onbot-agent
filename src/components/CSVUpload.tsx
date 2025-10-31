import { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  Download, 
  CheckCircle, 
  AlertTriangle // Adicionado para feedback de erro
} from 'lucide-react';
// 1. Importado para animações de nível especialista
import { motion, AnimatePresence } from 'framer-motion';

interface CSVUploadProps {
  token: string;
  companyId: string;
  onFileSelect?: (file: File) => void;
}

// 2. Definindo variantes de animação para código limpo
const panelVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

export const CSVUpload = ({ token, companyId, onFileSelect }: CSVUploadProps) => {
  // --- NENHUMA LÓGICA INTERNA FOI ALTERADA ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // ... Lógica original mantida ...
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
    // ... Lógica original mantida ...
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
    // ... Lógica original mantida ...
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
    // ... Lógica original mantida ...
    setSelectedFile(null);
    setUploadMessage(null);
    setFinished(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  // --- FIM DA LÓGICA INALTERADA ---


  // Variável para checagem de sucesso
  const isSuccess = finished && uploadMessage && uploadMessage.includes('✅');

  return (
    // 3. Fundo da página mais escuro para destacar o card
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-[#050505]">
      
      {/* 4. Card com animação de entrada e brilho (shadow) mais "tech" */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'circOut' }}
        className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-blue-900/50 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)] p-8 max-w-lg w-full backdrop-blur-sm"
      >
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">
          <span className="text-blue-500">C2S</span> – Create Sellers
        </h2>

        <p className="text-gray-400 text-sm mb-6">
          Envie sua planilha CSV para criar vendedores automaticamente.
        </p>

        <a
          href="https://docs.google.com/spreadsheets/d/1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo/export?format=csv&id=1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo&gid=0"
          download="modelo_c2s.csv"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-xs text-blue-400 bg-black/30 hover:bg-blue-500/10 hover:border-blue-700 hover:text-blue-300 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-500/10"
        >
          <Download className="w-4 h-4" />
          Baixar modelo CSV
        </a>

        {/* 5. Área de conteúdo principal com altura mínima para evitar pulos de layout */}
        <div className="mt-8 min-h-[210px] flex flex-col justify-center">
          
          {/* 6. AnimatePresence gerencia a transição entre o dropzone e o painel de status */}
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              
              // --- PAINEL DE DROPZONE ---
              <motion.div
                key="dropzone"
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: 'circOut' }}
                whileHover={{ scale: 1.02, borderColor: 'rgb(59 130 246 / 0.4)' }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors duration-300 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                    : 'border-gray-700 bg-black/40'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  {/* 7. Ícone com animação sutil de pulsação */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Upload className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
                  </motion.div>
                  <p className="text-base font-medium text-white">
                    {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo CSV'}
                  </p>
                  <p className="text-xs text-gray-500">
                    O token e o ID da empresa serão incluídos.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </motion.div>

            ) : (
              
              // --- PAINEL DE STATUS (UPLOAD/CONCLUÍDO) ---
              <motion.div
                key="status"
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: 'circOut' }}
                className="w-full text-left"
              >
                {/* 8. Informações do arquivo com botão de remover (só aparece se não estiver enviando) */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-shrink-0 bg-blue-500/20 p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {!isUploading && (
                    <motion.button
                      whileHover={{ scale: 1.1, color: 'rgb(248 113 113)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleRemoveFile}
                      className="text-gray-500 p-1"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>

                {/* 9. Área de status (Barra de Progresso + Mensagem) */}
                <div className="mt-6 space-y-3">
                  {isUploading && (
                    // 10. Barra de progresso "Tech" com efeito shimmer
                    <div className="w-full bg-blue-900/30 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-transparent via-blue-500 to-transparent w-1/2 h-full"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      />
                    </div>
                  )}

                  {/* 11. Mensagem de status unificada com ícones */}
                  {uploadMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center justify-center gap-2 text-sm ${
                        isSuccess ? 'text-green-400' :
                        finished ? 'text-red-400' :
                        'text-blue-400' // Cor "neutra" para "enviando..."
                      }`}
                    >
                      {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isSuccess && <CheckCircle className="w-4 h-4" />}
                      {finished && !isSuccess && <AlertTriangle className="w-4 h-4" />}
                      <span>{uploadMessage}</span>
                    </motion.div>
                  )}
                </div>

                {/* 12. Botão para "Novo Upload" só aparece ao finalizar */}
                {finished && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                    onClick={handleRemoveFile}
                    className="mt-8 w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/10"
                  >
                    Carregar Novo Arquivo
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default CSVUpload;