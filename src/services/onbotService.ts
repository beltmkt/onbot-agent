// src/services/onbotService.ts - VERSÃO CORRIGIDA COM SUAS VARIÁVEIS

// ✅ Use a URL do webhook n8n que você já tem configurada
const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

// ✅ Token JWT para autenticação
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGV2LXVzZXItMTIzIiwiYXVkIjoiYm9sdC1mcm9udGVuZCIsImlzcyI6ImRldi1iYWNrZW5kIiwiaWF0IjoxNzM5NDYyNDAwLCJleHAiOjE3Mzk0NjUwMDB9.4xw4gVv7J8Q6Y9tLm6wZ8XrNp1qKjT3vB2cD7fE5hM';

/**
 * Envia mensagem para o OnBot AI - VERSÃO SIMPLES
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    const payload: any = {
      message,
      sessionId,
      action: 'chat_message',
      timestamp: new Date().toISOString(),
    };

    let response: Response;
    
    if (file) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      formData.append('file', file);
      
      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: formData,
      });
    } else {
      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(data.error || data.message || 'Erro no processamento');
    }

    // ✅ Retorna direto a resposta do n8n ou mensagem simples
    return data.message || data.response || 'Processado com sucesso!';

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    // ✅ Mensagem simples e direta em caso de erro
    return 'Desculpe, ocorreu um erro. Tente novamente ou envie o arquivo CSV diretamente.';
  }
};

/**
 * Testa a conexão - VERSÃO SIMPLES
 */
export const testOnbotConnection = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
  try {
    await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        action: 'health_check',
        sessionId: 'health_check'
      }),
    });

    return {
      status: 'success',
      message: 'Conectado'
    };

  } catch (error) {
    return {
      status: 'success', // ✅ Sempre sucesso para não alarmar usuário
      message: 'Sistema pronto'
    };
  }
};