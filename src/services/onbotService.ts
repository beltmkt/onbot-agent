// src/services/onbotService.ts

/**
 * Serviço para comunicação com o n8n/OnBot
 * Gerencia envio de mensagens e processamento de respostas em tempo real
 */

export const sendMessageToOnbot = async (
  message: string,
  sessionId: string,
  file?: File
): Promise<string> => {
  try {
    console.log('🔄 Enviando para n8n:', { 
      message, 
      sessionId, 
      hasFile: !!file,
      fileInfo: file ? `${file.name} (${file.type}, ${file.size} bytes)` : 'Nenhum'
    });

    const url = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

    // 🔥 Se houver arquivo, envia como FormData
    if (file) {
      const formData = new FormData();
      formData.append('chatInput', message);
      formData.append('sessionId', sessionId);
      formData.append('file', file);

      console.log('📁 Enviando arquivo via FormData:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sessionId: sessionId
      });

      const response = await fetch(url, { 
        method: 'POST', 
        body: formData 
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro HTTP ${response.status}:`, errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('📨 Resposta bruta (FormData):', responseText);
      return processN8NResponse(responseText);
    }

    // 🔥 Se não houver arquivo, envia JSON normal
    console.log('📤 Enviando JSON para n8n:', { chatInput: message, sessionId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        chatInput: message, 
        sessionId 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('📨 Resposta bruta (JSON):', {
      raw: responseText,
      length: responseText.length,
      first100: responseText.substring(0, 100)
    });
    
    return processN8NResponse(responseText);

  } catch (error) {
    console.error('❌ Erro no serviço OnBot:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return '🔌 **Erro de conexão**\n\nVerifique sua conexão com a internet e tente novamente.';
      }
      if (error.message.includes('HTTP')) {
        return '🌐 **Erro no servidor**\n\nO servidor está temporariamente indisponível. Tente novamente em alguns instantes.';
      }
    }
    
    return '⚠️ **Erro inesperado**\n\nOcorreu um problema inesperado. Por favor, tente novamente.';
  }
};

/**
 * Processa respostas do n8n em diferentes formatos
 * - SSE Stream com chunks
 * - JSON único
 * - Texto puro
 */
const processN8NResponse = (responseText: string): string => {
  console.log('🔧 INICIANDO PROCESSAMENTO DA RESPOSTA');
  console.log('📨 Resposta bruta recebida:', responseText);

  // 🔹 Verifica se a resposta está vazia
  if (!responseText || responseText.trim() === '') {
    console.log('📭 Resposta vazia do servidor');
    return '✅ **Mensagem recebida!**\n\nO OnBot processou sua solicitação.';
  }

  // 🔹 CASO 1: Verifica se já é uma mensagem completa do OnBot
  const onBotMessages = [
    'Olá! Eu sou o OnBot',
    'OnBot',
    'Token de acesso',
    'Onboarding',
    'Agente Digital'
  ];
  
  const hasOnBotContent = onBotMessages.some(term => responseText.includes(term));
  if (hasOnBotContent && responseText.length > 20) {
    console.log('✅ Mensagem do OnBot detectada diretamente');
    return extractAndCleanMessage(responseText);
  }

  // 🔹 CASO 2: Processamento de formato SSE com chunks
  if (responseText.includes('"type":"item"') && responseText.includes('"content":"')) {
    console.log('🎯 Processando formato SSE com chunks...');
    
    const sseResult = processSSEFormat(responseText);
    if (sseResult.success) {
      console.log('✅ SSE processado com sucesso:', sseResult.message);
      return sseResult.message;
    }
    console.log('❌ Falha no processamento SSE, tentando próximo método...');
  }

  // 🔹 CASO 3: Processamento como JSON único
  if ((responseText.startsWith('{') && responseText.endsWith('}')) || 
      (responseText.startsWith('[') && responseText.endsWith(']'))) {
    console.log('📋 Processando como JSON único...');
    
    const jsonResult = processSingleJSON(responseText);
    if (jsonResult.success) {
      console.log('✅ JSON único processado:', jsonResult.message);
      return jsonResult.message;
    }
    console.log('❌ Falha no processamento JSON único...');
  }

  // 🔹 CASO 4: Extração agressiva via regex (fallback)
  console.log('🔍 Tentando extração via regex...');
  const regexResult = extractWithRegex(responseText);
  if (regexResult.success) {
    console.log('✅ Regex extraiu mensagem:', regexResult.message);
    return regexResult.message;
  }

  // 🔹 CASO 5: Fallback final - mensagem padrão
  console.log('🔄 Nenhum método funcionou, usando fallback padrão');
  return '👋 **Olá! Sou o OnBot, seu Assistente de Onboarding!**\n\nEstou pronto para ajudar na criação de usuários!\n\n🔑 **Para começarmos, por favor envie seu Token de acesso à empresa.**';
};

/**
 * Processa formato SSE (Server-Sent Events) com múltiplos chunks
 */
const processSSEFormat = (responseText: string): { success: boolean; message: string } => {
  try {
    const lines = responseText.split('\n').filter(line => line.trim() !== '');
    let fullMessage = '';
    let chunksFound = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      try {
        const data = JSON.parse(trimmedLine);
        
        if (data.type === 'item' && data.content && typeof data.content === 'string') {
          fullMessage += data.content;
          chunksFound++;
          console.log(`📦 Chunk ${chunksFound}:`, data.content);
        }
      } catch (e) {
        // Ignora linhas que não são JSON válido - comum em streams SSE
        continue;
      }
    }
    
    if (chunksFound > 0 && fullMessage.trim()) {
      const cleanedMessage = fullMessage
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\')
        .trim();
      
      return { success: true, message: cleanedMessage };
    }
  } catch (error) {
    console.error('❌ Erro ao processar formato SSE:', error);
  }
  
  return { success: false, message: '' };
};

/**
 * Processa resposta como um único objeto JSON
 */
const processSingleJSON = (responseText: string): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(responseText);
    
    // Verifica diferentes estruturas possíveis de resposta
    if (data.content && typeof data.content === 'string') {
      return { success: true, message: data.content.trim() };
    }
    if (data.message && typeof data.message === 'string') {
      return { success: true, message: data.message.trim() };
    }
    if (data.text && typeof data.text === 'string') {
      return { success: true, message: data.text.trim() };
    }
    if (data.response && typeof data.response === 'string') {
      return { success: true, message: data.response.trim() };
    }
    if (Array.isArray(data)) {
      // Processa array de itens
      const messages = data
        .filter(item => item.content && typeof item.content === 'string')
        .map(item => item.content);
      
      if (messages.length > 0) {
        return { success: true, message: messages.join('\n').trim() };
      }
    }
    
    // Se for objeto mas não tem campos conhecidos, converte para string
    if (typeof data === 'object') {
      return { success: true, message: JSON.stringify(data, null, 2) };
    }
  } catch (error) {
    console.error('❌ Erro ao processar JSON único:', error);
  }
  
  return { success: false, message: '' };
};

/**
 * Extração agressiva usando regex para encontrar conteúdo
 */
const extractWithRegex = (responseText: string): { success: boolean; message: string } => {
  try {
    // Padrões para extrair conteúdo
    const patterns = [
      /"content":"([^"]*)"/g,        // "content":"texto"
      /"message":"([^"]*)"/g,        // "message":"texto"  
      /"text":"([^"]*)"/g,           // "text":"texto"
      /"response":"([^"]*)"/g,       // "response":"texto"
      /content[=:]\s*["']?([^"'\s}]+)/gi, // content: "texto"
    ];

    for (const pattern of patterns) {
      const matches = responseText.match(pattern);
      if (matches && matches.length > 0) {
        const extracted = matches
          .map(match => {
            // Remove aspas e chaves do conteúdo
            return match
              .replace(/(content|message|text|response)[=:]\s*["']?/, '')
              .replace(/["']\s*[,}]?$/, '')
              .replace(/^["']/, '')
              .replace(/["']$/, '');
          })
          .join('')
          .replace(/\\n/g, '\n')
          .replace(/\\\\/g, '\\')
          .trim();

        if (extracted && extracted.length > 3) {
          return { success: true, message: extracted };
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro na extração regex:', error);
  }
  
  return { success: false, message: '' };
};

/**
 * Limpa e formata a mensagem final
 */
const extractAndCleanMessage = (text: string): string => {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\')
    .replace(/\*\*(.*?)\*\*/g, '**$1**') // Mantém markdown
    .replace(/\s+/g, ' ')
    .trim();
};

// 🔹 Export para debug (remover em produção)
export const debugOnBotService = {
  processN8NResponse,
  processSSEFormat,
  processSingleJSON,
  extractWithRegex
};