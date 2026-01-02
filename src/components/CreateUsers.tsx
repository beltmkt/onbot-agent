import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TokenInput } from './TokenInput';
import { CSVUpload } from './CSVUpload';
import { uploadCSVToN8N } from '../services/csvService';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { validateCompanyToken } from '../services/tokenService';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

type MessageType = 'success' | 'error' | 'info';
type Step = 'tokenValidation' | 'csvUpload';

const cardVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

export const CreateUsers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [tokenConfirmed, setTokenConfirmed] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('tokenValidation'); // Controla a etapa atual

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadMessageType, setUploadMessageType] = useState<MessageType>('info');
  const [finished, setFinished] = useState(false);

  const handleTokenConfirm = async () => {
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }
    setTokenError(null);
    const result = await validateCompanyToken(token, user.email);
    if (result.success) {
      setTokenConfirmed(true);
      setCurrentStep('csvUpload'); // Avança para a próxima etapa
      setTokenError(null);
      toast.success('Token validado com sucesso!');
    } else {
      setTokenError(result.error || 'Token inválido');
      toast.error(result.error || 'Token inválido');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setFinished(false);
    setUploadMessage('Enviando arquivo para o servidor...');
    setUploadMessageType('info');

    await auditService.logCSVUpload(
      user.email,
      user.id,
      file.name,
      file.size,
      'pending',
      undefined,
      { started_at: new Date().toISOString(), token: token }
    );

    try {
      const result = await uploadCSVToN8N(file, token);

      if (result.success) {
        let messageContent = result.mensagem || 'Arquivo processado com sucesso!';
        let type: MessageType = 'success';

        if (result.parsedResponse && result.parsedResponse.content) {
          messageContent = result.parsedResponse.content;
        }

        const lowerCaseMessage = messageContent.toLowerCase();
        if (
          lowerCaseMessage.includes('erro') ||
          lowerCaseMessage.includes('já estão no sistema') ||
          lowerCaseMessage.includes('problemas') ||
          lowerCaseMessage.includes('tente novamente') ||
          lowerCaseMessage.includes('falha')
        ) {
          type = 'error';
        } else if (
          lowerCaseMessage.includes('workflow iniciado') ||
          lowerCaseMessage.includes('sucesso')
        ) {
          type = 'success';
        }

        const formattedMessage = messageContent.replace(/\n/g, '<br />');

        setUploadMessage(formattedMessage);
        setUploadMessageType(type);

        if (type === 'success') {
          toast.success(formattedMessage, { dangerouslySetInnerHTML: true });
        } else {
          toast.error(formattedMessage, { dangerouslySetInnerHTML: true });
        }

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'success',
          undefined,
          { completed_at: new Date().toISOString(), response_message: formattedMessage }
        );
      } else {
        let messageContent = result.mensagem || 'Falha no envio do arquivo.';
        let type: MessageType = 'error';

        if (result.parsedResponse && result.parsedResponse.content) {
          messageContent = result.parsedResponse.content;
        } else if (result.rawResponse) {
          messageContent = result.rawResponse;
        }

        const lowerCaseMessage = messageContent.toLowerCase();
        if (
          lowerCaseMessage.includes('workflow iniciado') ||
          lowerCaseMessage.includes('sucesso')
        ) {
          type = 'success';
        }

        const formattedMessage = messageContent.replace(/\n/g, '<br />');

        setUploadMessage(formattedMessage);
        setUploadMessageType(type);

        if (type === 'success') {
          toast.success(formattedMessage, { dangerouslySetInnerHTML: true });
        } else {
          toast.error(formattedMessage, { dangerouslySetInnerHTML: true });
        }

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'error',
          formattedMessage
        );
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const formattedErrorMessage = errorMessage.replace(/\n/g, '<br />');
      setUploadMessage(`Erro de conexão: ${formattedErrorMessage}`);
      setUploadMessageType('error');
      toast.error('Erro de conexão', { dangerouslySetInnerHTML: true, description: formattedErrorMessage });

      await auditService.logCSVUpload(
        user.email,
        user.id,
        file.name,
        file.size,
        'error',
        errorMessage
      );
    } finally {
      setIsUploading(false);
      setFinished(true);
    }
  };

  const handleRepeat = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadMessage(null);
    setFinished(false);
  };

  const handleNewAction = () => {
    handleRepeat();
    setTokenConfirmed(false);
    setToken('');
    setTokenError(null);
    setCurrentStep('tokenValidation'); // Volta para a etapa de validação de token
  };

  const handleFinish = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-extrabold text-white mb-10 text-center">
        Criar <span className="text-blue-500">Usuários</span>
      </h1>

      <div className="relative w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStep === 'tokenValidation' && (
            <motion.div
              key="tokenStep"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <TokenInput
                token={token}
                onTokenChange={setToken}
                onConfirm={handleTokenConfirm}
                errorMessage={tokenError}
              />
            </motion.div>
          )}

          {currentStep === 'csvUpload' && (
            <motion.div
              key="csvStep"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CSVUpload
                onFileSelect={handleFileUpload}
                onRepeat={handleRepeat}
                onNewAction={handleNewAction}
                onFinish={handleFinish}
                selectedFile={selectedFile}
                isUploading={isUploading}
                uploadMessage={uploadMessage}
                uploadMessageType={uploadMessageType}
                finished={finished}
                isDisabled={!tokenConfirmed} // Passa a prop isDisabled
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
