// src/services/onbotService.ts
export const sendMessageToOnbot = async (
  message: string,
  sessionId: string,
  file?: File
): Promise<string> => {
  try {
    console.log('🔄 Enviando para n8n:', { 
      message, 
      sessionId, 
      hasFile: !!file 
    });

    const url = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

    // 🔥 Se houver arquivo, envia como FormData NO FORMATO CORRETO
    if (file) {
      const formData = new FormData();
      
      // 🔥 FORMATO CORRETO: Cria um objeto único com todos os dados
      const inputData = {
        chatInput: message,
        sessionId: sessionId,
        file: file
      };
      
      // 🔥 Envia como JSON stringificado no FormData
      formData.append('data', JSON.stringify({
        chatInput: message,
        sessionId: sessionId
      }));
      
      // 🔥 Adiciona o arquivo separadamente
      formData.append('file', file);

      console.log('📁 Enviando arquivo via FormData corrigido:', {
        data: { chatInput: message, sessionId },
        file: file.name
      });

      const response = await fetch(url, { 
        method: 'POST', 
        body: formData 
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, errorText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('📨 Resposta bruta (FormData):', responseText);
      return processN8NResponse(responseText);
    }

    // 🔥 Se não houver arquivo, envia JSON normal (isso funciona)
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

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const responseText = await response.text();
    console.log('📨 Resposta bruta (JSON):', responseText);
    return processN8NResponse(responseText);

  } catch (error) {
    console.error('❌ Erro no serviço OnBot:', error);
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) return '🔌 Erro de conexão: Verifique sua internet.';
      if (error.message.includes('HTTP')) return '🌐 Erro no servidor: Tente novamente mais tarde.';
    }
    return '⚠️ Ocorreu um erro inesperado. Por favor, tente novamente.';
  }
};

// 🔹 Mantém o processamento da resposta (já está funcionando para texto)
const processN8NResponse = (responseText: string): string => {
  console.log('🔧 INICIANDO PROCESSAMENTO - Resposta bruta:', responseText);

  if (!responseText || responseText.trim() === '') {
    console.log('📭 Resposta vazia do servidor');
    return '👋 Olá! Sou o OnBot. Como posso ajudar?';
  }

  try {
    const data = JSON.parse(responseText);
    console.log('📋 JSON parseado:', data);

    // 🔹 Extrai a mensagem de erro ou sucesso
    if (data.error && typeof data.error === 'string') {
      console.error('❌ Erro do n8n:', data.error);
      
      // 🔹 Mensagens amigáveis para erros conhecidos
      if (data.error.includes('3 keys') || data.error.includes('input key')) {
        return '📎 **Erro de configuração do arquivo**\n\nO servidor não está configurado para receber arquivos no momento. Por favor, envie apenas mensagens de texto.';
      }
      
      return `⚠️ **Erro do servidor**: ${data.error}`;
    }

    if (data.output && typeof data.output === 'string') {
      console.log('✅ Extraído do campo "output":', data.output);
      return data.output;
    }

    if (data.content && typeof data.content === 'string') {
      console.log('✅ Extraído do campo "content":', data.content);
      return data.content;
    }

    if (Array.isArray(data)) {
      console.log('🔄 Processando array SSE');
      const messages = data
        .filter(item => item.content && typeof item.content === 'string')
        .map(item => item.content);
      
      if (messages.length > 0) {
        const fullMessage = messages.join('').trim();
        console.log('✅ Mensagem montada do array:', fullMessage);
        return fullMessage;
      }
    }

    // Se for objeto mas não tem campos conhecidos
    return JSON.stringify(data, null, 2);

  } catch (error) {
    console.log('📝 Não é JSON, retornando texto limpo');
    
    if (responseText.includes('Olá! Eu sou o OnBot') || responseText.includes('Token de acesso')) {
      const match = responseText.match(/"output":"([^"]*)"/);
      if (match && match[1]) {
        return match[1].replace(/\\n/g, '\n');
      }
    }
    
    return responseText.replace(/\\n/g, '\n').trim();
  }
};