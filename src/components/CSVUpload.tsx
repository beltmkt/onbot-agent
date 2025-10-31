import { useState, useRef } from 'react';
// 1. Adicionado 'ArrowLeft' para o botão de voltar
import { Upload, FileText, X, Loader2, Download, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CSVUploadProps {
  token: string;
  companyId: string;
  onFileSelect?: (file: File) => void;
  // 2. Nova prop para voltar
  onBack: () => void;
}

const panelVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

export const CSVUpload = ({ token, companyId, onFileSelect, onBack }: CSVUploadProps) => {
  // --- Lógica interna 100% mantida ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    /* ... sua lógica de upload original ... */
    // Apenas mudei a validação do token para uma mensagem mais clara
    if (!token) {
      setUploadMessage('⚠️ Token não encontrado. Volte e insira o token.');
      return;
    }
    setIsUploading(true);
    setUploadMessage('⏳ Enviando arquivo...');
    setFinished(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      /* ... resto da sua lógica de formData ... */
      formData.append('company_id', companyId); // Adicionado companyId
      
      const response = await fetch(
        'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final',
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ...lógica original... */ };
  const handleDrop = (e: React.DragEvent) => { /* ...lógica original... */ };
  const handleRemoveFile = () => { /* ...lógica original... */ };
  // --- Fim da lógica interna ---

  const isSuccess = finished && uploadMessage && uploadMessage.includes('✅');

  return (
    // 3. Wrapper de animação para a entrada do componente
    <motion.div
      key="upload"
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.4, ease: 'circOut' }}
      className="w-full"
    >
      {/* 4. Botão de "Voltar" (Trocar Token) */}
      <div className="w-full flex mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Trocar Token
        </button>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">
        <span className="text-blue-500">C2S</span> – Create Sellers
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Envie sua planilha CSV para criar vendedores automaticamente.
      </p>
      {/* ... Resto do seu JSX do CSVUpload 100% idêntico ... */}
      <a href="..." download="modelo_c2s.csv" ...>
        <Download className="w-4 h-4" /> Baixar modelo CSV
      </a>
      <div className="mt-8 min-h-[210px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div key="dropzone" ...> {/* ...dropzone... */} </motion.div>
          ) : (
            <motion.div key="status" ...> {/* ...painel de status... */} </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};