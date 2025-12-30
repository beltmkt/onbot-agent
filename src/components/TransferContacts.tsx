import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditService } from '../services/auditService';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';

type TransferStatus = {
  status: 'success' | 'warning' | 'error';
  message: string;
};

// Helpers for phone masking
const maskPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, '');
  value = value.replace(/^(\d{2})(\d)/g, '() $2');
  value = value.replace(/(\d{5})(\d)/, '-$2');
  return value.slice(0, 15); // (XX) XXXXX-XXXX
};

const unmaskPhone = (value: string) => {
  return value.replace(/\D/g, '');
};

const WEBHOOK_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/transferir-contato';

export const TransferContacts: React.FC = () => {
  const { user } = useAuth();
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transferStatus, setTransferStatus] = useState<TransferStatus | null>(null);

  // Clear status when user starts typing again
  useEffect(() => {
    if (contactName || companyName || phone) {
      setTransferStatus(null);
    }
  }, [contactName, companyName, phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTransferStatus(null); // Clear previous status on new submission

    if (!contactName || !companyName || !phone) {
        setTransferStatus({
            status: 'error',
            message: 'Todos os campos são obrigatórios.',
        });
      return;
    }

    setIsLoading(true);

    const payload = {
      nome: `${contactName} | ${companyName}`,
      telefone: unmaskPhone(phone),
      userEmail: user?.email,
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if the response is JSON, otherwise treat as an error
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta inválida do servidor. O n8n pode estar offline ou com erro interno.");
      }

      const data = await response.json();

      setTransferStatus({
        status: data.status || 'error',
        message: data.message || 'Resposta inesperada do servidor.',
      });

      if (data.status === 'success') {
        if(user?.email) {
          auditService.createLog({
            userEmail: user.email,
            actionType: 'contact_transfer',
            status: 'success',
            metadata: {
              contact_name: contactName,
              company_name: companyName,
            }
          });
        }
        setContactName('');
        setCompanyName('');
        setPhone('');
      }
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão. Não foi possível contatar o servidor.';
      setTransferStatus({
        status: 'error',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusIcon = (status: TransferStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusColorClass = (status: TransferStatus['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-900/50 border-green-500';
      case 'warning':
        return 'bg-yellow-900/50 border-yellow-500';
      case 'error':
        return 'bg-red-900/50 border-red-500';
    }
  }


  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white">Transferir Contatos</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Contato
            </label>
            <input
              type="text"
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Digite o nome do contato"
            />
          </div>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Empresa
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Digite o nome da empresa"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
              Telefone
            </label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              required
              className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isLoading ? 'Processando...' : 'Transferir'}
          </button>
        </form>
        
        {transferStatus && (
          <div className={`mt-6 p-4 rounded-lg border flex items-start space-x-3 ${getStatusColorClass(transferStatus.status)}`}>
            <div>{getStatusIcon(transferStatus.status)}</div>
            <p className="text-sm">{transferStatus.message}</p>
          </div>
        )}

      </div>
    </div>
  );
};