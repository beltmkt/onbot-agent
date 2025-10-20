// src/services/onbotService.ts - VERSÃO CORRIGIDA COM SUAS VARIÁVEIS

// ✅ Use a URL do webhook n8n que você já tem configurada
const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

// ✅ Token JWT para autenticação
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGV2LXVzZXItMTIzIiwiYXVkIjoiYm9sdC1mcm9udGVuZCIsImlzcyI6ImRldi1iYWNrZW5kIiwiaWF0IjoxNzM5NDYyNDAwLCJleHAiOjE3Mzk0NjUwMDB9.4xw4gVv7J8Q6Y9tLm6wZ8XrNp1qKjT3vB2cD7fE5hM';

interface OnbotResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface ConnectionTestResult {
  status: 'success' | 'error';
  message: string;
}

/**
 * Testa a conexão com o serviço OnBot
 */
export const testOnbotConnection = async (): Promise<ConnectionTestResult> => {
  try {
    console.log('🔗 Testando conexão com:', ONBOT_API_URL);
    
    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        action: 'health_check',
        sessionId: 'health_check_' + Date.now()
      }),
    });

    if (response.ok) {
      return {
        status: 'success',
        message: 'Conexão estabelecida com sucesso'
      };
    } else {
      console.warn('⚠️ Serviço respondeu com status:', response.status);
      return {
        status: 'error', 
        message: 'Serviço temporariamente indisponível'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return {
      status: 'error',
      message: 'Serviço não disponível - Verifique a conexão'
    };
  }
};

/**
 * Envia mensagem para o OnBot AI via webhook n8n
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('🚀 Enviando para webhook n8n:', ONBOT_API_URL);
    
    const formData = new FormData();
    formData.append('message', message);
    formData.append('sessionId', sessionId);
    formData.append('action', 'chat_message');
    
    if (file) {
      console.log('📎 Anexando arquivo:', file.name, file.type);
      formData.append('file', file);
    }

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    console.log('📨 Resposta recebida - Status:', response.status);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Dados recebidos:', data);
    
    if (data.success) {
      return data.message || data.response || 'Mensagem processada com sucesso!';
    } else {
      throw new Error(data.message || data.error || 'Erro ao processar mensagem');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para OnBot:', error);
    
    // ✅ Mensagem amigável baseada no tipo de erro
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('net::ERR')) {
        return '🌐 **Erro de Conexão**\n\nNão foi possível conectar ao serviço OnBot AI.\n\n🔍 **Verifique:**\n- Sua conexão com a internet\n- Se o webhook n8n está online\n- A URL do webhook nas configurações\n\n💡 **Enquanto isso:** Você pode enviar arquivos CSV diretamente pelo formulário principal.';
      } else if (error.message.includes('404')) {
        return '🔍 **Webhook Não Encontrado**\n\nO endpoint do OnBot AI não foi encontrado.\n\n⚙️ **Solução:**\n- Verifique se a URL do webhook n8n está correta\n- Confirme se o webhook está ativo no n8n\n- Teste o webhook diretamente\n\n📁 **Alternativa:** Use o upload de CSV tradicional.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        return '🔐 **Erro de Autenticação**\n\nToken de acesso inválido ou expirado.\n\n🔑 **Solução:**\n- Verifique se o token JWT está correto\n- Renove o token se necessário\n- Confirme as permissões de acesso\n\n💡 Você ainda pode usar o sistema de upload CSV.';
      }
    }
    
    return '🤖 **OnBot AI - Em Configuração**\n\nEstamos ajustando a conexão com o serviço AI.\n\n📋 **Funcionalidades Disponíveis:**\n- Upload de arquivos CSV pelo formulário\n- Criação de usuários com token\n- Interface de chat demonstrativa\n\n🔧 **Status:** Backend em implantação\n⏳ **Previsão:** Em breve totalmente operacional!\n\n💡 **Dica:** Envie seus CSVs pelo botão de anexo para testar.';
  }
};

/**
 * Processa arquivo CSV via webhook n8n
 */
export const processCSVFile = async (file: File, token: string): Promise<OnbotResponse> => {
  try {
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('token', token);
    formData.append('action', 'process_csv');

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao processar arquivo CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo CSV - Tente novamente'
    };
  }
};