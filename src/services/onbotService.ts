// src/services/onbotService.ts - VERSÃO COM CAMPO csvFile

const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

/**
 * Envia mensagem para o OnBot AI e retorna APENAS o texto da resposta do n8n
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    if (!ONBOT_API_URL) {
      throw new Error('URL do webhook não configurada');
    }

    const payload = {
      sessionId: sessionId,
      chatInput: message,
      action: file ? 'process_csv' : 'chat_message',
      timestamp: new Date().toISOString(),
    };

    console.log('🚀 Enviando para n8n:', { 
      payload, 
      hasFile: !!file,
      fileName: file?.name 
    });

    let response: Response;
    
    if (file) {
      // ✅ CORREÇÃO: Usando 'csvFile' que o n8n provavelmente espera
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('chatInput', message);
      formData.append('action', 'process_csv');
      formData.append('timestamp', new Date().toISOString());
      
      // ✅ CORREÇÃO CRÍTICA: Campo 'csvFile' para arquivos CSV
      formData.append('csvFile', file);
      
      console.log('📁 Enviando arquivo CSV:', file.name);
      
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

    console.log('📨 Status da resposta:', response.status);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('📨 Resposta do n8n:', data);

    if (data && typeof data === 'object') {
      if (data.output && typeof data.output === 'string') {
        return data.output;
      } else if (data.response && typeof data.response === 'string') {
        return data.response;
      } else if (data.message && typeof data.message === 'string') {
        return data.message;
      }
    }

    return 'Resposta recebida. Continue a conversa.';

  } catch (error) {
    console.error('❌ Erro:', error);
    
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
    if (!ONBOT_API_URL) {
      return {
        status: 'error',
        message: 'URL não configurada'
      };
    }

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
    console.error('Erro no teste de conexão:', error);
    return {
      status: 'error',
      message: 'Erro de conexão'
    };
  }
};

/**
 * Processa arquivo CSV via webhook n8n - COM CAMPO csvFile
 */
export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  try {
    if (!ONBOT_API_URL) {
      return {
        success: false,
        message: 'URL não configurada'
      };
    }

    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chatInput', 'upload_csv');
    formData.append('action', 'process_csv');
    formData.append('token', token);
    formData.append('timestamp', new Date().toISOString());
    
    // ✅ CORREÇÃO: Campo 'csvFile' para arquivos CSV
    formData.append('csvFile', file);

    console.log('📁 Processando CSV:', file.name);

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    console.log('📨 Resposta CSV - Status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('📨 Resposta CSV:', data);
    
    if (data && data.output) {
      return { ...data, message: data.output };
    }
    
    return data;

  } catch (error) {
    console.error('❌ Erro ao processar CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo'
    };
  }
};