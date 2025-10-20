// src/services/onbotService.ts - VERSÃO COMPLETA CORRIGIDA

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
      originalMessage: message,
      finalMessage: finalMessage
    });

    let response: Response;
    
    if (file) {
      // ✅ PARA ARQUIVOS: FormData com campo csvFile
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('chatInput', finalMessage);
      formData.append('action', 'process_csv');
      formData.append('timestamp', new Date().toISOString());
      
      // ✅ CAMPO CORRETO PARA ARQUIVO CSV
      formData.append('csvFile', file);
      
      console.log('📁 Enviando arquivo CSV:', file.name, 'tipo:', file.type, 'tamanho:', file.size);
      
      // ✅ DEBUG: Mostra todos os campos do FormData
      for (const pair of formData.entries()) {
        console.log('📋 FormData:', pair[0], pair[1]);
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

    // ✅ EXTRAI APENAS O TEXTO DA RESPOSTA - PRIORIDADE PARA "output"
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
      } else if (data.text && typeof data.text === 'string') {
        console.log('✅ Retornando campo "text":', data.text);
        return data.text;
      } else if (data.answer && typeof data.answer === 'string') {
        console.log('✅ Retornando campo "answer":', data.answer);
        return data.answer;
      }
    }

    // ✅ Fallback seguro
    console.log('⚠️ Estrutura não reconhecida, usando fallback');
    return file 
      ? 'Arquivo recebido e processado com sucesso!' 
      : 'Mensagem recebida com sucesso!';

  } catch (error) {
    console.error('❌ Erro no sendMessageToOnbot:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('404')) {
        return 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
      } else if (error.message.includes('500')) {
        return 'Erro interno do servidor. O time técnico foi notificado.';
      }
      return `Erro: ${error.message}`;
    }
    
    return 'Erro ao processar sua solicitação. Tente novamente.';
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

    console.log('🔗 Testando conexão com n8n...');

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('🔗 Status do teste de conexão:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('🔗 Resposta do teste de conexão:', data);
      
      return {
        status: 'success',
        message: 'Conectado ao serviço OnBot AI'
      };
    } else {
      return {
        status: 'error',
        message: 'Serviço temporariamente indisponível'
      };
    }

  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    return {
      status: 'error',
      message: 'Não foi possível conectar ao serviço'
    };
  }
};

/**
 * Processa arquivo CSV via webhook n8n
 */
export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  try {
    if (!ONBOT_API_URL) {
      return {
        success: false,
        message: 'URL do webhook não configurada'
      };
    }

    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chatInput', 'upload_csv');
    formData.append('action', 'process_csv');
    formData.append('token', token);
    formData.append('timestamp', new Date().toISOString());
    
    // ✅ CAMPO CORRETO PARA ARQUIVO CSV
    formData.append('csvFile', file);

    console.log('📁 Processando arquivo CSV:', file.name);

    // ✅ DEBUG: Mostra todos os campos do FormData
    for (const pair of formData.entries()) {
      console.log('📋 FormData CSV:', pair[0], pair[1]);
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
      const errorText = await response.text();
      console.error('❌ Erro HTTP no CSV:', errorText);
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('📨 Resposta completa do CSV:', data);
    
    // ✅ Extrai resposta para CSV também
    if (data && data.output) {
      return { ...data, message: data.output };
    }
    
    return data;

  } catch (error) {
    console.error('❌ Erro ao processar CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo CSV. Verifique o formato e tente novamente.'
    };
  }
};

/**
 * Função auxiliar para verificar se é um token válido
 */
export const isLikelyToken = (text: string): boolean => {
  const cleanText = text.trim();
  
  if (cleanText.length >= 20 && cleanText.length <= 64) {
    const hexRegex = /^[0-9a-fA-F]+$/;
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    
    return hexRegex.test(cleanText) || base64Regex.test(cleanText);
  }
  
  return false;
};