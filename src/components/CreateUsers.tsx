import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TokenInput } from './TokenInput';
import { CSVUpload } from './CSVUpload';
import { uploadCSVToN8N } from '../services/csvService';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';

export const CreateUsers: React.FC = () => {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [tokenConfirmed, setTokenConfirmed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
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
        setUploadMessage(`Arquivo processado com sucesso!`);
        toast.success('CSV enviado com sucesso!');

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
        setUploadMessage(`Falha no envio do arquivo`);
        toast.error('Erro ao enviar CSV');

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
      setUploadMessage('Erro de conexão. Tente novamente.');
      toast.error('Erro de conexão');

      await auditService.logCSVUpload(
        user.email,
        user.id,
        file.name,
        file.size,
        'error',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    } finally {
      setIsUploading(false);
      setFinished(true);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadMessage(null);
    setFinished(false);
  };

  const handleFinishAndHome = () => {
    handleRemoveFile();
    setTokenConfirmed(false);
    setToken('');
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
            onBack={() => setTokenConfirmed(false)}
            onRemoveFile={handleRemoveFile}
            onFinishAndHome={handleFinishAndHome}
            selectedFile={selectedFile}
            isUploading={isUploading}
            uploadMessage={uploadMessage}
            finished={finished}
            token={token}
            companyId="C2S"
            />
        )}
        </div>
    </div>
  );
};
