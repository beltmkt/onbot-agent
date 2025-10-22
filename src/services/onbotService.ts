// src/services/onbotService.ts - VERSÃO COM DADOS COMPLETOS

const CHAT_WEBHOOK_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';
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
      console.log('📁 Arquivo detectado - enviando para webhook de DADOS');
      return await sendFileToDataWebhook(file, sessionId, message);
    }

    // ✅ DETECTA SELEÇÃO DE EMPRESA (número 1, 2, ou 3)
    const empresaSelection = detectEmpresaSelection(message);
    if (empresaSelection) {
      console.log('🏢 Seleção de empresa detectada:', empresaSelection);
      return await sendEmpresaSelection(empresaSelection, sessionId);
    }

    // ✅ MENSAGEM NORMAL: Envia para webhook de CHAT
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

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    return data.output || data.response || data.message || 'Processado!';

  } catch (error) {
    console.error('❌ Erro:', error);
    return 'Erro ao processar. Tente novamente.';
  }
};

/**
 * Detecta seleção de empresa (1, 2, ou 3)
 */
const detectEmpresaSelection = (message: string): { numero: number; nome: string } | null => {
  const cleanMessage = message.trim();
  
  if (cleanMessage === '1') {
    return { numero: 1, nome: 'Onboarding' };
  } else if (cleanMessage === '2') {
    return { numero: 2, nome: 'Onboarding | Joinville' };
  } else if (cleanMessage === '3') {
    return { numero: 3, nome: 'Onboarding | Olha o Mistério' };
  }
  
  return null;
};

/**
 * Envia seleção de empresa com dados completos
 */
const sendEmpresaSelection = async (
  empresa: { numero: number; nome: string },
  sessionId: string
): Promise<string> => {
  try {
    const payload = {
      sessionId: sessionId,
      chatInput: `Selecionar empresa: ${empresa.numero} - ${empresa.nome}`,
      action: 'select_empresa',
      timestamp: new Date().toISOString(),
      token: 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5',
      // ✅ DADOS COMPLETOS DA EMPRESA
      empresa: {
        numero: empresa.numero,
        nome: empresa.nome,
        id: empresa.nome.toLowerCase().replace(/\s+\|\s+/g, '-').replace(/\s+/g, '-')
      },
      // ✅ INFORMA QUE É UMA SELEÇÃO
      isEmpresaSelection: true,
      selectedEmpresa: empresa.nome
    };

    console.log('🏢 Enviando seleção de empresa:', empresa);

    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    return data.output || data.response || data.message || `Empresa ${empresa.nome} selecionada!`;

  } catch (error) {
    console.error('❌ Erro ao selecionar empresa:', error);
    return 'Erro ao selecionar empresa. Tente novamente.';
  }
};

/**
 * ENVIA ARQUIVOS para o webhook de DADOS como FormData
 */
const sendFileToDataWebhook = async (
  file: File, 
  sessionId: string, 
  message: string = ''
): Promise<string> => {
  try {
    console.log('📁 Enviando arquivo como FormData:', file.name);

    const formData = new FormData();
    
    // ✅ CAMPOS DE METADADOS
    formData.append('sessionId', sessionId);
    formData.append('chatInput', message || `Upload de CSV: ${file.name}`);
    formData.append('action', 'process_csv');
    formData.append('timestamp', new Date().toISOString());
    formData.append('token', 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5');
    formData.append('empresa', 'Onboarding | Olha o Mistério');
    formData.append('processType', 'csv_upload');
    
    // ✅ ARQUIVO COMO BINÁRIO
    formData.append('file', file);

    console.log('🚀 Enviando FormData para DADOS:', file.name);

    const response = await fetch(DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

    console.log('📨 Status DADOS:', response.status);

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
 * Processa arquivo CSV via webhook de DADOS
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
    formData.append('file', file);

    const response = await fetch(DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: formData,
    });

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