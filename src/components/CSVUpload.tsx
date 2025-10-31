import { useRef, useState } from 'react'; // Adicionado useState
import { Upload, FileText, X, Loader2, Download, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CSVUploadProps {
  onFileSelect: (file: File) => void;
  onBack: () => void;
  onRemoveFile: () => void;
  
  selectedFile: File | null;
  isUploading: boolean;
  uploadMessage: string | null;
  finished: boolean;

  // Adicionado para corrigir erro de prop
  token: string; 
  companyId: string;
}

// Adicionado para animação
const panelVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

export const CSVUpload = ({
  onFileSelect,
  onBack,
  onRemoveFile,
  selectedFile,
  isUploading,
  uploadMessage,
  finished,
  token, // Adicionado
  companyId // Adicionado
}: CSVUploadProps) => {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    }
  };
  
  const handleInternalRemove = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemoveFile();
  }

  const isSuccess = finished && uploadMessage && uploadMessage.includes('✅');

  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, ease: 'circOut' }}
      className="w-full"
    >
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
        Envie sua planilha CSV para criar vendedores.
      </p>

      {/* ✅ CORRIGIDO: Adicionado className */}
      <a
        href="https://docs.google.com/spreadsheets/d/1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo/export?format=csv&id=1IwOyAPOmJVd9jhk5KBUmzHcqS8VoJ-sql0zADDUXmUo&gid=0"
        download="modelo_c2s.csv"
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-xs text-blue-400 bg-black/30 hover:bg-blue-500/10 hover:border-blue-700 transition-all"
      >
        <Download className="w-4 h-4" />
        Baixar modelo CSV
      </a>

      <div className="mt-8 min-h-[210px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            // ✅ CORRIGIDO: Adicionado props de animação e className
            <motion.div
              key="dropzone"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              whileHover={{ scale: 1.02, borderColor: 'rgb(59 130 246 / 0.4)' }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors duration-300 ${ isDragging ? 'border-blue-500 bg-blue-500/10 scale-105' : 'border-gray-700 bg-black/40' }`}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Upload className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
                </motion.div>
                <p className="text-base font-medium text-white">
                  {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o CSV'}
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </motion.div>
          ) : (
            // ✅ CORRIGIDO: Adicionado props de animação e className
            <motion.div
              key="status"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full text-left"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-shrink-0 bg-blue-500/20 p-3 rounded-lg"><FileText className="w-6 h-6 text-blue-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                {!isUploading && (
                  // ✅ CORRIGIDO: Adicionado className
                  <motion.button
                    whileHover={{ scale: 1.1, color: 'rgb(248 113 113)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleInternalRemove}
                    className="text-gray-500 p-1"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {isUploading && (
                  // ✅ CORRIGIDO: Adicionado className
                  <div className="w-full bg-blue-900/30 rounded-full h-2.5 overflow-hidden">
                    {/* ✅ CORRIGIDO: Adicionado props de animação e className */}
                    <motion.div
                      className="bg-gradient-to-r from-transparent via-blue-500 to-transparent w-1/2 h-full"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                  </div>
                )}
                {uploadMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-center gap-2 text-sm ${ isSuccess ? 'text-green-400' : finished ? 'text-red-400' : 'text-blue-400' }`}
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSuccess && <CheckCircle className="w-4 h-4" />}
                    {finished && !isSuccess && <AlertTriangle className="w-4 h-4" />}
                    <span>{uploadMessage}</span>
                  </motion.div>
                )}
              </div>

              {finished && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                  onClick={handleInternalRemove}
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
  );
};

export default CSVUpload;