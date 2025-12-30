import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TokenInput } from './TokenInput';
import { CSVUpload } from './CSVUpload';
import { uploadCSVToN8N } from '../services/csvService';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type MessageType = 'success' | 'error' | 'info';

export const CreateUsers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [tokenConfirmed, setTokenConfirmed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadMessageType, setUploadMessageType] = useState<MessageType>('info');
  const [finished, setFinished] = useState(false);

  const handleTokenConfirm = () => {
    setTokenConfirmed(true);
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
        setUploadMessage(result.mensagem || 'Arquivo processado com sucesso!');
        setUploadMessageType('success');
        toast.success(result.mensagem || 'CSV enviado com sucesso!');

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'success',
          undefined,
          { completed_at: new Date().toISOString() }
        );
      } else {
        setUploadMessage(result.mensagem || 'Falha no envio do arquivo.');
        setUploadMessageType('error');
        toast.error(result.mensagem || 'Erro ao enviar CSV');

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'error',
          result.mensagem
        );
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setUploadMessage(`Erro de conexão: ${errorMessage}`);
      setUploadMessageType('error');
      toast.error('Erro de conexão');

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
  };

  const handleFinish = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
        <div className="space-y-8">
        {!tokenConfirmed ? (
            <TokenInput
            token={token}
            onTokenChange={setToken}
            onConfirm={handleTokenConfirm}
            />
        ) : (
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
            />
        )}
        </div>
    </div>
  );
};
