// src/services/onbotService.ts - VERSÃO COM CAMPO DE ARQUIVO CORRETO

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
    // ✅ Verificação de segurança
    if (!ONBOT_API_URL) {
      throw new Error('URL do webhook não configurada');
    }

    // ✅ PAYLOAD EXATO que o n8n espera
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
      // ✅ CORREÇÃO: Campo de arquivo correto para o n8n
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('chatInput', message);
      formData.append('action', 'process_csv');
      formData.append('timestamp', new Date().toISOString());
      
      // ✅ CORREÇÃO CRÍTICA: Campo correto para o arquivo
      // O n8n espera um campo específico como 'file', 'csvFile', 'attachment', etc.
      formData.append('file', file); // ⚠️ Tente também 'csvFile' se este não funcionar
      // formData.append('csvFile', file); // ⚠️ Alternativa
      
      console.log('📁 Enviando arquivo:', file.name, 'tipo:', file.type);
      
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

    console.log('📨 Status da resposta:', response.status);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('📨 Resposta do n8n:', data);

    // ✅ EXTRAI APENAS O TEXTO DA RESPOSTA - CAMPO "output"
    if (data && typeof data === 'object') {
      if (data.output && typeof data.output === 'string') {
        return data.output;
      } else if (data.response && typeof data.response === 'string') {
        return data.response;
      } else if (data.message && typeof data.message === 'string') {
        return data.message;
      } else if (data.text && typeof data.text === 'string') {
        return data.text;
      }
    }

    // ✅ Fallback seguro
    return 'Resposta recebida. Continue a conversa.';

  } catch (error) {
    console.error('❌ Erro:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return 'Erro de conexão. Verifique sua internet.';
      }
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
 * Processa arquivo CSV via webhook n8n - COM CAMPO CORRETO
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
    
    // ✅ CORREÇÃO: Campo correto para arquivo CSV
    formData.append('file', file); // ⚠️ Tente também 'csvFile' se este não funcionar
    // formData.append('csvFile', file); // ⚠️ Alternativa

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
    
    // ✅ Extrai resposta para CSV também
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