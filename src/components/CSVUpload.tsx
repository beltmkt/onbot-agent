import { useRef, useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertTriangle, Repeat, Lock, Hash, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type MessageType = 'success' | 'error' | 'info';

interface CSVUploadProps {
  onFileSelect: (file: File) => void;
  onRepeat: () => void;
  onNewAction: () => void;
  onFinish: () => void;
  selectedFile: File | null;
  isUploading: boolean;
  uploadMessage: string | null;
  uploadMessageType: MessageType;
  finished: boolean;
  isDisabled: boolean; // Nova prop
}

const panelVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

export const CSVUpload = ({
  onFileSelect,
  onRepeat,
  onNewAction,
  onFinish,
  selectedFile,
  isUploading,
  uploadMessage,
  uploadMessageType,
  finished,
  isDisabled // Desestruturar a nova prop
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
  
  const handleRemoveFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRepeat(); 
  }

  const getMessageColor = () => {
    if (finished) {
      if (uploadMessageType === 'success') return 'text-green-400';
      if (uploadMessageType === 'error') return 'text-red-400';
    }
    return 'text-blue-400';
  };

  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, ease: 'circOut' }}
      className={`w-full max-w-lg mx-auto relative ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {isDisabled && (
        <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center text-gray-400">
            <Lock size={48} className="mb-4" />
            <p className="text-lg font-semibold">Valide o token primeiro</p>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
        <span className="text-blue-600 dark:text-blue-500">Upload</span> de Dados
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Envie sua planilha CSV para criar vendedores na plataforma.
      </p>

      {/* Download do modelo CSV movido para o componente pai se necessário */}

      <div className="min-h-[250px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!selectedFile || finished ? (
            <motion.div
              key="dropzone"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {!finished ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors duration-300 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500/10 scale-105'
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Upload className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
                    </motion.div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o CSV'}
                    </p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                </div>
              ) : (
                <div className="text-center">
                  {uploadMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center justify-center gap-2 text-sm p-4 rounded-lg ${getMessageColor().replace('text-', 'bg-').replace('-400', '/10')} ${getMessageColor()}`}
                    >
                      {uploadMessageType === 'success' && <CheckCircle className="w-4 h-4" />}
                      {uploadMessageType === 'error' && <AlertTriangle className="w-4 h-4" />}
                      <span dangerouslySetInnerHTML={{ __html: uploadMessage }}></span>
                    </motion.div>
                  )}
                  <div className="flex flex-col gap-3 mt-6">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                      onClick={onRepeat}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg"
                    >
                      <Repeat className="w-4 h-4" />
                      Subir Novo Arquivo
                    </motion.button>
                     <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                      onClick={onNewAction}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600"
                    >
                      <Hash className="w-4 h-4" />
                      Inserir Outro Token
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                      onClick={onFinish}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600"
                    >
                      <Power className="w-4 h-4" />
                      Finalizar Tarefa
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="status"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full text-left"
            >
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-500/20 p-3 rounded-lg"><FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                {!isUploading && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {isUploading && (
                  <div className="w-full bg-gray-200 dark:bg-blue-900/30 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-transparent via-blue-600 dark:via-blue-500 to-transparent w-1/2 h-full"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                  </div>
                )}
                {uploadMessage && !finished &&(
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-center gap-2 text-sm ${getMessageColor()}`}
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span dangerouslySetInnerHTML={{ __html: uploadMessage }}></span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};