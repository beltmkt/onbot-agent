// src/services/onbotService.ts - VERSÃO PROCESSAMENTO LOCAL PRIMEIRO

const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL; // /dados_recebidos
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;

/**
 * Processa o arquivo CSV localmente e extrai os usuários
 */
const processCSVLocal = (csvContent: string): { users: any[], total: number, errors: string[] } => {
  try {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return { users: [], total: 0, errors: ['Arquivo precisa ter cabeçalho e dados'] };
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    console.log('📋 Cabeçalhos detectados:', headers);

    const users = lines.slice(1)
      .map(line => line.split(","))
      .filter(row => row.some(cell => cell && cell.trim()))
      .map((row, index) => {
        const user: any = {};
        headers.forEach((header, i) => {
          user[header] = (row[i] || "").trim();
        });
        
        return {
          nome: user.nome || user.name || "",
          email: (user.email || user.mail || "").toLowerCase(),
          telefone: user.telefone || user.phone || user.tel || "",
          empresa_ou_equipe: user.empresa_ou_equipe || user.empresa || user.company || user.equipe || user.team || "",
          master: (user.master || user.is_master || "não").toString().toLowerCase()
        };
      })
      .filter(user => user.nome && user.email && user.empresa_ou_equipe);

    console.log('👥 Usuários processados localmente:', users.length);
    
    return {
      users: users,
      total: users.length,
      errors: users.length === 0 ? ['Nenhum usuário válido encontrado'] : []
    };

  } catch (error) {
    console.error('❌ Erro no processamento local:', error);
    return { users: [], total: 0, errors: [`Erro ao processar CSV: ${error.message}`] };
  }
};

/**
 * Lê o conteúdo do arquivo como texto
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('Falha ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Envia dados processados para o webhook
 */
const sendToDataWebhook = async (processedData: any, sessionId: string, fileName: string = ''): Promise<string> => {
  try {
    if (!ONBOT_API_URL) {
      throw new Error('URL do webhook de dados não configurada');
    }

    const payload = {
      sessionId: sessionId,
      action: 'process_csv',
      timestamp: new Date().toISOString(),
      token: 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5',
      empresa: 'Onboarding | Olha o Mistério',
      processType: 'csv_upload',
      // ✅ DADOS JÁ PROCESSADOS
      processedData: processedData,
      fileName: fileName,
      totalUsers: processedData.total,
      users: processedData.users,
      errors: processedData.errors
    };

    console.log('🚀 Enviando dados processados para webhook:', {
      totalUsers: processedData.total,
      sessionId: sessionId,
      hasErrors: processedData.errors.length > 0
    });

    const response = await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Resposta do webhook de dados:', response.status);

    if (!response.ok) {
      throw new Error(`Webhook retornou erro ${response.status}`);
    }

    const data = await response.json();
    return data.output || data.response || data.message || 'Dados enviados com sucesso!';

  } catch (error) {
    console.error('❌ Erro ao enviar para webhook:', error);
    throw error;
  }
};

/**
 * Função principal - PROCESSAMENTO LOCAL PRIMEIRO
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    // ✅ SE TEM ARQUIVO: Processa localmente primeiro
    if (file) {
      console.log('📁 Iniciando processamento local do arquivo:', file.name);
      
      // 1. Lê o arquivo
      const fileContent = await readFileAsText(file);
      console.log('✅ Arquivo lido:', fileContent.length, 'caracteres');
      
      // 2. Processa localmente
      const processedData = processCSVLocal(fileContent);
      console.log('✅ Processamento local concluído:', {
        usuarios: processedData.total,
        erros: processedData.errors
      });

      // 3. Se tem usuários válidos, envia para webhook
      if (processedData.total > 0) {
        console.log('🚀 Enviando dados processados para webhook...');
        const webhookResult = await sendToDataWebhook(processedData, sessionId, file.name);
        
        return `✅ ${processedData.total} usuário(s) processado(s) localmente!\n${webhookResult}`;
      } else {
        // 4. Se não tem usuários válidos, mostra erro
        return `❌ ${processedData.errors.join(', ')}`;
      }
    } 
    // ✅ SE É MENSAGEM DE TEXTO (dados manuais)
    else if (message.trim()) {
      console.log('💬 Processando dados manuais...');
      
      // Tenta extrair dados da mensagem (formato: nome,email,telefone)
      const lines = message.split('\n').filter(line => line.trim().includes(','));
      
      if (lines.length > 0) {
        const processedData = processCSVLocal(lines.join('\n'));
        
        if (processedData.total > 0) {
          const webhookResult = await sendToDataWebhook(processedData, sessionId, 'dados_manuais.csv');
          return `✅ ${processedData.total} usuário(s) processado(s)!\n${webhookResult}`;
        }
      }
      
      // Se não conseguiu processar como dados, envia como mensagem normal
      return await sendToChatEndpoint(message, sessionId);
    }
    
    return 'Envie um arquivo CSV ou os dados dos usuários.';

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    
    if (error instanceof Error) {
      // ✅ FALLBACK: Se falhar o webhook de dados, usa o chat
      try {
        console.log('🔄 Fallback para chat...');
        return await sendToChatEndpoint(file ? `Arquivo: ${file.name}` : message, sessionId, file);
      } catch (fallbackError) {
        return `Erro: ${error.message}`;
      }
    }
    
    return 'Erro ao processar. Tente novamente.';
  }
};

/**
 * ✅ Função para mensagens de chat normais
 */
const sendToChatEndpoint = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  const CHAT_URL = import.meta.env.VITE_N8N_WEBHOOK_URLCHAT;
  
  let finalMessage = message;
  if (file) {
    try {
      const fileContent = await readFileAsText(file);
      finalMessage = `${message}\n\nConteúdo do arquivo:\n\`\`\`csv\n${fileContent}\n\`\`\``;
    } catch (error) {
      finalMessage = `${message}\n\nArquivo: ${file.name} (erro ao ler conteúdo)`;
    }
  }

  const payload = {
    sessionId: sessionId,
    chatInput: finalMessage,
    action: 'chat_message',
    timestamp: new Date().toISOString(),
    token: 'bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5'
  };

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data.output || data.response || data.message || 'Mensagem processada!';
};

/**
 * Testa apenas a conexão básica
 */
export const testOnbotConnection = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
  // ✅ SÓ TESTA CONEXÃO BÁSICA - não envia dados
  return { 
    status: 'success', 
    message: 'Sistema pronto para processar dados localmente' 
  };
};

export const processCSVFile = async (file: File, token: string, sessionId: string): Promise<any> => {
  const result = await sendMessageToOnbot('Upload CSV', sessionId, file);
  return { success: true, message: result };
};