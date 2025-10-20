// src/services/onbotService.ts - VERSÃO COMPATÍVEL COM SEU DECODIFICADOR

const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

/**
 * Converte File para Base64 (formato que seu decodificador espera)
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove o prefixo "data:*/*;base64,"
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error('Falha ao converter arquivo para base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Envia mensagem para o OnBot AI - COMPATÍVEL COM SEU DECODIFICADOR
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

    // ✅ CORREÇÃO: Se só tem arquivo sem mensagem, envia mensagem específica
    const finalMessage = file && !message.trim() 
      ? 'Enviando arquivo CSV com dados dos usuários' 
      : message;

    let response: Response;
    
    if (file) {
      // ✅ ESTRATÉGIA 1: Enviar como JSON com base64 (mais confiável)
      console.log('📁 Convertendo arquivo para base64...');
      const fileBase64 = await fileToBase64(file);
      
      const payload = {
        sessionId: sessionId,
        chatInput: finalMessage,
        action: 'process_csv',
        timestamp: new Date().toISOString(),
        // ✅ ENVIA O ARQUIVO COMO BASE64 NO JSON (seu decodificador busca aqui)
        fileContent: fileBase64,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };

      console.log('🚀 Enviando arquivo como base64 no JSON:', {
        fileName: file.name,
        fileSize: file.size,
        base64Length: fileBase64.length,
        sessionId: sessionId
      });

      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

    } else {
      // ✅ PARA MENSAGENS: JSON direto
      const payload = {
        sessionId: sessionId,
        chatInput: finalMessage,
        action: 'chat_message',
        timestamp: new Date().toISOString(),
      };

      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
    }

    console.log('📨 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP detalhado:', errorText);
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📨 Resposta do n8n:', data);

    // ✅ EXTRAI APENAS O TEXTO DA RESPOSTA
    if (data && typeof data === 'object') {
      if (data.output && typeof data.output === 'string') {
        return data.output;
      } else if (data.response && typeof data.response === 'string') {
        return data.response;
      } else if (data.message && typeof data.message === 'string') {
        return data.message;
      }
    }

    return file 
      ? 'Arquivo recebido! Processando...' 
      : 'Mensagem recebida com sucesso!';

  } catch (error) {
    console.error('❌ Erro no sendMessageToOnbot:', error);
    
    if (error instanceof Error) {
      return `Erro: ${error.message}`;
    }
    
    return 'Erro ao processar sua solicitação. Tente novamente.';
  }
};

/**
 * Processa arquivo CSV via webhook n8n - COMPATÍVEL
 */
export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  try {
    if (!ONBOT_API_URL) {
      return {
        success: false,
        message: 'URL do webhook não configurada'
      };
    }

    // ✅ CONVERTE PARA BASE64 (compatível com seu decodificador)
    const fileBase64 = await fileToBase64(file);

    const payload = {
      sessionId: sessionId,
      chatInput: 'upload_csv',
      action: 'process_csv',
      token: token,
      timestamp: new Date().toISOString(),
      fileContent: fileBase64, // ✅ SEU DECODIFICADOR BUSCA AQUI
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    };

    console.log('📁 Processando CSV como base64:', file.name);

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Resposta CSV - Status:', response.status);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('📨 Resposta do CSV:', data);
    
    return data;

  } catch (error) {
    console.error('❌ Erro ao processar CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo CSV.'
    };
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
        message: 'URL do webhook não configurada'
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
    console.error('❌ Erro no teste de conexão:', error);
    return {
      status: 'error',
      message: 'Erro de conexão'
    };
  }
};