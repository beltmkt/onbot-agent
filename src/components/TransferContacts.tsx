import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditService } from '../services/auditService';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type TransferStatus = {
  status: 'success' | 'warning' | 'error';
  message: string;
};

// Helper for phone masking
const formatPhone = (value: string): string => {
  if (!value) return "";

  // 1. Remove tudo que não for dígito (0-9)
  let cleanedValue = value.replace(/\D/g, '');

  // 2. Limita a 11 números (DDD + 9 dígitos)
  cleanedValue = cleanedValue.substring(0, 11);

  // 3. Aplica a formatação visual progressiva: (XX) XXXXX-XXXX
  let formattedValue = cleanedValue;
  if (cleanedValue.length > 0) {
    formattedValue = `(${cleanedValue.substring(0, 2)}`;
  }
  if (cleanedValue.length >= 3) {
    formattedValue += `) ${cleanedValue.substring(2, 7)}`;
  }
  if (cleanedValue.length >= 8) {
    formattedValue += `-${cleanedValue.substring(7, 11)}`;
  }

  return formattedValue;
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
      telefone: phone.replace(/\D/g, ''),
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

      // Se a resposta não for OK (ex: 4xx, 5xx), lança um erro para ser pego pelo catch
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro do servidor (${response.status}): ${errorText || response.statusText}`);
      }

      const data: any = await response.json(); // O usuário confirmou que é JSON válido

      // console.log('Resposta do Webhook do n8n (depois de ok check):', data); // Para depuração, se necessário

      // Lógica flexível para interpretar a resposta
      if (data.status) {
        // Formato antigo/esperado: { status: 'success' | 'error', message: '...' }
        setTransferStatus({
          status: data.status,
          message: data.message || 'Resposta inesperada do servidor.',
        });
        if (data.status === 'success') {
          // Limpa o formulário e loga apenas se for sucesso no formato antigo
          if(user?.email) {
            auditService.createLog({
              userEmail: user.email,
              actionType: 'contact_transfer',
              status: 'success',
              metadata: {
                contact_name: contactName,
                company_name: companyName,
                response_message: data.message,
              }
            });
          }
          setContactName('');
          setCompanyName('');
          setPhone('');
        }
      } else if (data.content) {
        // Novo formato detectado: { content: ' **Contato transferido com sucesso!** ... ' }
        const cleanedContent = data.content.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove asteriscos de Markdown
        setTransferStatus({
          status: 'success', // Considera como sucesso se tiver content
          message: cleanedContent,
        });
        toast.success(cleanedContent); // Exibe no Toast de sucesso
        // Limpa o formulário
        setContactName('');
        setCompanyName('');
        setPhone('');

        // Log da ação para sucesso no novo formato (se user.email estiver disponível)
        if(user?.email) {
          auditService.createLog({
            userEmail: user.email,
            actionType: 'contact_transfer',
            status: 'success',
            metadata: {
              contact_name: contactName,
              company_name: companyName,
              response_content: data.content, // Opcional: logar o content original
            }
          });
        }
      } else {
        // Resposta inesperada sem status nem content
        setTransferStatus({
          status: 'error',
          message: 'Resposta do servidor com formato inesperado. Não possui "status" nem "content".',
        });
        toast.error('Resposta do servidor com formato inesperado.');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">Transferir Contatos</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg w-full max-w-2xl">
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
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              required
              className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-wait flex flex-col items-center justify-center"
          >
            {isLoading ? 'Processando...' : 'Transferir'}
          </button>
        </form>
        
        {transferStatus && (
          <div className={`mt-6 w-full p-6 rounded-lg border flex items-start space-x-3 ${getStatusColorClass(transferStatus.status)}`}>
            <div>{getStatusIcon(transferStatus.status)}</div>
            <p className="text-sm break-words whitespace-pre-line">{transferStatus.message}</p>
          </div>
        )}

      </div>
    </div>
  );
};