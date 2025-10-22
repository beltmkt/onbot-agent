// src/services/onbotService.ts - VERSÃO COM FORMDATA

// ✅ WEBHOOK PARA MENSAGENS
const CHAT_WEBHOOK_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

// ✅ WEBHOOK PARA DADOS/ARQUIVOS  
const DATA_WEBHOOK_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos';

const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

/**
 * Envia MENSAGENS para o webhook de chat
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    // ✅ SE TEM ARQUIVO: Envia para webhook de DADOS como FormData
    if (file) {
      console.log('📁 Arquivo detectado - enviando para webhook de DADOS como FormData');
      return await sendFileToDataWebhook(file, sessionId, message);
    }

    // ✅ SE É MENSAGEM: Envia para webhook de CHAT como JSON
    console.log('💬 Mensagem de texto - enviando para webhook de CHAT');
    
    const payload = {
      sessionId: sessionId,
      chatInput: message,
      action: 'chat_message',
      timestamp: new Date().toISOString(),
      token: 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5'
    };

    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Status CHAT:', response.status);

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    return data.output || data.response || data.message || 'Mensagem processada!';

  } catch (error) {
    console.error('❌ Erro no chat:', error);
    return 'Erro ao processar mensagem. Tente novamente.';
  }
};

/**
 * ✅ ENVIA ARQUIVOS para o webhook de DADOS como FORMDATA
 */
const sendFileToDataWebhook = async (
  file: File, 
  sessionId: string, 
  message: string = ''
): Promise<string> => {
  try {
    console.log('📁 Enviando arquivo como FormData:', file.name);

    // ✅ EXTRAI TOKEN DA MENSAGEM
    const userToken = extractTokenFromMessage(message);

    // ✅ CRIA FORMDATA (formato que o n8n espera para arquivos)
    const formData = new FormData();
    
    // ✅ CAMPOS DE METADADOS
    formData.append('sessionId', sessionId);
    formData.append('chatInput', message || `Upload de CSV: ${file.name}`);
    formData.append('action', 'process_csv');
    formData.append('timestamp', new Date().toISOString());
    formData.append('token', userToken || 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5');
    formData.append('empresa', 'Onboarding | Olha o Mistério');
    formData.append('processType', 'csv_upload');
    
    // ✅ ARQUIVO COMO BINÁRIO (campo que seu decodificador busca)
    formData.append('file', file); // ⚠️ Campo "file" que o n8n espera
    // formData.append('csvFile', file); // ⚠️ Alternativa se "file" não funcionar

    console.log('🚀 Enviando FormData para DADOS:', {
      fileName: file.name,
      fileSize: file.size,
      sessionId: sessionId,
      fields: ['sessionId', 'chatInput', 'action', 'token', 'file']
    });

    // ✅ DEBUG: Mostra todos os campos do FormData
    for (const pair of formData.entries()) {
      console.log('📋 FormData:', pair[0], pair[1]);
    }

    const response = await fetch(DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        // ✅ NÃO envia Content-Type - o browser define automaticamente com boundary
      },
      body: formData, // ✅ ENVIA COMO FORMDATA
    });

    console.log('📨 Status DADOS:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro DADOS:', errorText);
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Resposta dos DADOS:', data);

    return data.output || data.response || data.message || 'Arquivo processado com sucesso!';

  } catch (error) {
    console.error('❌ Erro ao enviar arquivo:', error);
    return 'Erro ao processar arquivo. Tente novamente.';
  }
};

/**
 * Extrai token da mensagem do usuário
 */
const extractTokenFromMessage = (message: string): string | undefined => {
  const tokenPattern = /[a-fA-F0-9]{40,64}/;
  const match = message.match(tokenPattern);
  return match ? match[0] : undefined;
};

/**
 * Processa arquivo CSV via webhook de DADOS (FormData)
 */
export const processCSVFile = async (
  file: File, 
  token: string, 
  sessionId: string
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chatInput', `Upload de CSV: ${file.name}`);
    formData.append('action', 'process_csv');
    formData.append('token', token);
    formData.append('timestamp', new Date().toISOString());
    formData.append('empresa', 'Onboarding | Olha o Mistério');
    formData.append('processType', 'csv_upload');
    formData.append('file', file); // ✅ ARQUIVO COMO BINÁRIO

    console.log('📁 Processando CSV via FormData:', file.name);

    const response = await fetch(DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    console.log('📨 Resposta CSV:', response.status);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
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
 * Testa a conexão
 */
export const testOnbotConnection = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
  try {
    const payload = {
      sessionId: 'health_check',
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { status: 'success', message: 'Conectado' };
    } else {
      return { status: 'error', message: 'Erro de conexão' };
    }

  } catch (error) {
    return { status: 'error', message: 'Erro de conexão' };
  }
};