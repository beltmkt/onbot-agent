// src/services/onbotService.ts - VERSÃO COM MÚLTIPLAS TENTATIVAS

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

    // ✅ CORREÇÃO: Se só tem arquivo sem mensagem, envia mensagem específica
    const finalMessage = file && !message.trim() 
      ? 'Enviando arquivo CSV com dados dos usuários' 
      : message;

    const payload = {
      sessionId: sessionId,
      chatInput: finalMessage,
      action: file ? 'process_csv' : 'chat_message',
      timestamp: new Date().toISOString(),
    };

    console.log('🚀 Enviando para n8n:', { 
      payload, 
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });

    let response: Response;
    
    if (file) {
      // ✅ TENTATIVA 1: FormData com campo 'file' (mais comum)
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('chatInput', finalMessage);
      formData.append('action', 'process_csv');
      formData.append('timestamp', new Date().toISOString());
      
      // ✅ TENTANDO DIFERENTES CAMPOS PARA O ARQUIVO
      formData.append('file', file); // Tentativa 1: campo 'file'
      // formData.append('csvFile', file); // Tentativa 2: campo 'csvFile' 
      // formData.append('attachment', file); // Tentativa 3: campo 'attachment'
      // formData.append('data', file); // Tentativa 4: campo 'data'
      
      console.log('📁 Enviando arquivo com campo "file":', file.name);
      
      // ✅ DEBUG: Mostra todos os campos do FormData
      console.log('📋 Campos do FormData:');
      for (const pair of formData.entries()) {
        console.log('  ', pair[0], ':', pair[1]);
      }
      
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

    console.log('📨 Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP detalhado:', errorText);
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📨 Resposta completa do n8n:', data);

    // ✅ EXTRAI APENAS O TEXTO DA RESPOSTA
    if (data && typeof data === 'object') {
      if (data.output && typeof data.output === 'string') {
        console.log('✅ Retornando campo "output":', data.output);
        return data.output;
      } else if (data.response && typeof data.response === 'string') {
        console.log('✅ Retornando campo "response":', data.response);
        return data.response;
      } else if (data.message && typeof data.message === 'string') {
        console.log('✅ Retornando campo "message":', data.message);
        return data.message;
      }
    }

    // ✅ Fallback seguro
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
 * Processa arquivo CSV via webhook n8n - COM CAMPOS ALTERNATIVOS
 */
export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  try {
    if (!ONBOT_API_URL) {
      return {
        success: false,
        message: 'URL do webhook não configurada'
      };
    }

    // ✅ TENTATIVA COM DIFERENTES CAMPOS
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chatInput', 'upload_csv');
    formData.append('action', 'process_csv');
    formData.append('token', token);
    formData.append('timestamp', new Date().toISOString());
    
    // ✅ TENTANDO DIFERENTES CAMPOS PARA O ARQUIVO
    formData.append('file', file); // Campo principal
    formData.append('csvFile', file); // Campo alternativo
    
    console.log('📁 Processando arquivo CSV:', file.name);
    console.log('📋 Campos do FormData CSV:');
    for (const pair of formData.entries()) {
      console.log('  ', pair[0], ':', pair[1]);
    }

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    console.log('📨 Resposta CSV - Status:', response.status);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('📨 Resposta completa do CSV:', data);
    
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