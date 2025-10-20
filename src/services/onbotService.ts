// src/services/onbotService.ts - VERSÃO CORRIGIDA COM SUAS VARIÁVEIS

// ✅ Use a URL do webhook n8n que você já tem configurada
const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

// ✅ Token JWT para autenticação
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGV2LXVzZXItMTIzIiwiYXVkIjoiYm9sdC1mcm9udGVuZCIsImlzcyI6ImRldi1iYWNrZW5kIiwiaWF0IjoxNzM5NDYyNDAwLCJleHAiOjE3Mzk0NjUwMDB9.4xw4gVv7J8Q6Y9tLm6wZ8XrNp1qKjT3vB2cD7fE5hM';
// src/services/onbotService.ts - VERSÃO QUE RECONHECE TOKENS

// src/services/onbotService.ts - VERSÃO COM SESSIONID CORRETO

/**
 * Verifica se o texto é um token (baseado no formato)
 */
const isLikelyToken = (text: string): boolean => {
  const cleanText = text.trim();
  
  if (cleanText.length >= 20 && cleanText.length <= 64) {
    const hexRegex = /^[0-9a-fA-F]+$/;
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    
    return hexRegex.test(cleanText) || base64Regex.test(cleanText);
  }
  
  return false;
};

/**
 * Gera respostas inteligentes baseadas na mensagem do usuário
 */
const generateSmartResponse = (userMessage: string, data: any): string => {
  const message = userMessage.toLowerCase().trim();
  
  if (isLikelyToken(userMessage)) {
    return '✅ **Token recebido com sucesso!**\n\nAgora me envie o arquivo CSV com os dados dos usuários. Use o botão de anexo 📎 para enviar o arquivo.';
  }
  
  if (message.includes('ola') || message.includes('olá') || message.includes('oi') || message.includes('hello')) {
    return 'Olá! Sou o OnBot. Envie-me o token de acesso da sua empresa para começarmos.';
  }
  
  if (message.includes('token') || message.includes('acesso') || message.includes('chave')) {
    return 'Perfeito! Aguardo o token de acesso. Ele geralmente é uma sequência longa de letras e números.';
  }
  
  if (message.includes('arquivo') || message.includes('csv') || message.includes('dados') || message.includes('planilha')) {
    return 'Ótimo! Use o botão de anexo 📎 para enviar o arquivo CSV.';
  }
  
  if (message.includes('ajuda') || message.includes('help') || message.includes('como usar')) {
    return 'Posso ajudar você a criar usuários! Siga estes passos:\n1. Envie o token de acesso\n2. Envie o arquivo CSV com os dados\n3. Confirmarei a criação dos usuários';
  }
  
  if (data.message || data.response) {
    return data.message || data.response;
  }
  
  return `Obrigado pela mensagem! Para criar usuários, preciso que você:\n\n1. **Envie o token de acesso** da sua empresa\n2. **Envie o arquivo CSV** com os dados dos usuários\n\nVamos começar pelo token! 🔑`;
};

/**
 * Envia mensagem para o OnBot AI - COM SESSIONID CORRETO
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    // ✅ PAYLOAD CORRETO - sessionId NO CORPO PRINCIPAL
    const payload = {
      sessionId: sessionId,
      chatInput: message,
      action: file ? 'process_csv' : 'chat_message',
      timestamp: new Date().toISOString(),
    };

    console.log('🚀 [PAYLOAD] Enviando para n8n:', payload);

    let response: Response;
    
    if (file) {
      // ✅ PARA ARQUIVOS: sessionId NO FORM DATA TAMBÉM
      const formData = new FormData();
      formData.append('sessionId', sessionId); // ✅ IMPORTANTE: sessionId no FormData
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
      // ✅ PARA MENSAGENS: sessionId NO JSON
      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
    }

    console.log('📨 [RESPOSTA] Status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📨 [RESPOSTA] Dados do n8n:', data);

    if (data.success === false) {
      throw new Error(data.error || data.message || 'Erro no processamento');
    }

    return generateSmartResponse(message, data);

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    
    if (error instanceof Error) {
      return `Erro: ${error.message}. Tente novamente ou envie o arquivo CSV diretamente.`;
    }
    
    return 'Não consegui processar sua mensagem. Tente novamente.';
  }
};

/**
 * Testa a conexão
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
 * Processa arquivo CSV via webhook n8n - COM SESSIONID CORRETO
 */
export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  try {
    // ✅ PARA CSV: sessionId NO FORM DATA
    const formData = new FormData();
    formData.append('sessionId', sessionId); // ✅ CRÍTICO: sessionId no FormData
    formData.append('chatInput', 'upload_csv');
    formData.append('action', 'process_csv');
    formData.append('token', token);
    formData.append('timestamp', new Date().toISOString());
    formData.append('file', file);

    console.log('📁 [CSV UPLOAD] Enviando arquivo com sessionId:', sessionId);

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    console.log('📨 [CSV RESPONSE] Status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📨 [CSV RESPONSE] Dados:', data);
    
    return data;

  } catch (error) {
    console.error('❌ Erro ao processar arquivo CSV:', error);
    return {
      success: false,
      message: 'Erro ao processar arquivo CSV - Tente novamente'
    };
  }
};