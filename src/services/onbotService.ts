// src/services/onbotService.ts - VERSÃO CORRIGIDA COM SUAS VARIÁVEIS

// ✅ Use a URL do webhook n8n que você já tem configurada
const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

// ✅ Token JWT para autenticação
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGV2LXVzZXItMTIzIiwiYXVkIjoiYm9sdC1mcm9udGVuZCIsImlzcyI6ImRldi1iYWNrZW5kIiwiaWF0IjoxNzM5NDYyNDAwLCJleHAiOjE3Mzk0NjUwMDB9.4xw4gVv7J8Q6Y9tLm6wZ8XrNp1qKjT3vB2cD7fE5hM';
/**
 * Envia mensagem para o OnBot AI e retorna APENAS o texto da resposta do n8n
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    // ✅ PAYLOAD EXATO que o n8n espera
    const payload = {
      sessionId: sessionId,
      chatInput: message,
      action: file ? 'process_csv' : 'chat_message',
      timestamp: new Date().toISOString(),
    };

    console.log('🚀 [ENVIANDO] Payload para n8n:', payload);

    let response: Response;
    
    if (file) {
      // ✅ PARA ARQUIVOS: FormData com sessionId
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('chatInput', message);
      formData.append('action', 'process_csv');
      formData.append('timestamp', new Date().toISOString());
      formData.append('file', file);
      
      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: formData,
      });
    } else {
      // ✅ PARA MENSAGENS: JSON direto
      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
    }

    console.log('📨 [RESPOSTA] Status HTTP:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📨 [RESPOSTA COMPLETA] Dados do n8n:', data);

    // ✅ EXTRAI APENAS O TEXTO DA RESPOSTA - CAMPO "output"
    if (data.output) {
      console.log('✅ [TEXTO EXTRAÍDO] output:', data.output);
      return data.output; // ✅ RETORNA APENAS O TEXTO DO CAMPO "output"
    } 
    // ✅ FALLBACK: outros campos possíveis
    else if (data.response) {
      console.log('✅ [TEXTO EXTRAÍDO] response:', data.response);
      return data.response;
    } else if (data.message) {
      console.log('✅ [TEXTO EXTRAÍDO] message:', data.message);
      return data.message;
    } else if (data.text) {
      console.log('✅ [TEXTO EXTRAÍDO] text:', data.text);
      return data.text;
    } else if (typeof data === 'string') {
      console.log('✅ [TEXTO EXTRAÍDO] string direta:', data);
      return data;
    } else {
      console.warn('⚠️ Estrutura de resposta não reconhecida:', data);
      // Se não encontrar, retorna o JSON formatado como fallback
      return JSON.stringify(data, null, 2);
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    
    if (error instanceof Error) {
      return `Erro: ${error.message}`;
    }
    
    return 'Erro ao processar sua mensagem. Tente novamente.';
  }
};

/**
 * Testa a conexão com o n8n
 */
export const testOnbotConnection = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
  try {
    const payload = {
      sessionId: 'health_check_' + Date.now(),
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return {
        status: 'success',
        message: 'Conectado'
      };
    } else {
      return {
        status: 'error',
        message: 'Serviço indisponível'
      };
    }

  } catch (error) {
    return {
      status: 'error',
      message: 'Erro de conexão'
    };
  }
};

/**
 * Processa arquivo CSV via webhook n8n
 */
export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chatInput', 'upload_csv');
    formData.append('action', 'process_csv');
    formData.append('token', token);
    formData.append('timestamp', new Date().toISOString());
    formData.append('file', file);

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // ✅ PARA CSV TAMBÉM: extrai apenas o texto
    if (data.output) {
      return { ...data, message: data.output };
    }
    
    return data;

  } catch (error) {
    console.error('❌ Erro ao processar arquivo CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo CSV'
    };
  }
};