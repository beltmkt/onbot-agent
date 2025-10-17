// src/services/onbotService.ts

/**
 * Serviço para comunicação com o n8n/OnBot
 * Suporta envio de mensagens, arquivos e processa respostas SSE ou JSON
 */

export const sendMessageToOnbot = async (
  message: string,
  sessionId: string,
  files?: File[]
): Promise<string> => {
  try {
    const url = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('chatInput', message);
      formData.append('sessionId', sessionId);
      files.forEach(file => formData.append('files', file));

      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const responseText = await response.text();
      return processN8NResponse(responseText);
    }

    // Sem arquivos → JSON
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ chatInput: message, sessionId })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const responseText = await response.text();
    return processN8NResponse(responseText);

  } catch (error) {
    console.error('Erro no serviço OnBot:', error);
    return '⚠️ **Erro de comunicação**\n\nOcorreu um problema ao enviar a mensagem. Tente novamente.';
  }
};

/**
 * Processa a resposta do n8n/OnBot
 * Suporta:
 * - SSE com múltiplos chunks
 * - JSON único
 * - Texto puro
 */
export const processN8NResponse = (responseText: string): string => {
  if (!responseText || !responseText.trim()) {
    return '✅ **Mensagem recebida!**\n\nO OnBot processou sua solicitação.';
  }

  // SSE com chunks
  if (responseText.includes('"type":"item"') && responseText.includes('"content":"')) {
    const result = processSSEFormat(responseText);
    if (result.success) return result.message;
  }

  // JSON único
  if ((responseText.startsWith('{') && responseText.endsWith('}')) ||
      (responseText.startsWith('[') && responseText.endsWith(']'))) {
    const result = processSingleJSON(responseText);
    if (result.success) return result.message;
  }

  // Regex fallback
  const regexResult = extractWithRegex(responseText);
  if (regexResult.success) return regexResult.message;

  // Fallback final
  return '👋 **Olá! Sou o OnBot, seu Assistente de Onboarding!**\n\nEnvie seu Token para começar.';
};

// ---------------------- AUXILIARES ----------------------

const processSSEFormat = (text: string): { success: boolean; message: string } => {
  try {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    let full = '';
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'item' && data.content) full += data.content;
      } catch { continue; }
    }
    if (full.trim()) return { success: true, message: full.replace(/\\n/g, '\n').trim() };
  } catch (error) { console.error(error); }
  return { success: false, message: '' };
};

const processSingleJSON = (text: string): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(text);
    if (data.content) return { success: true, message: data.content.trim() };
    if (data.message) return { success: true, message: data.message.trim() };
    if (Array.isArray(data)) {
      const msgs = data.filter(d => d.content).map(d => d.content);
      if (msgs.length > 0) return { success: true, message: msgs.join('\n').trim() };
    }
  } catch (error) { console.error(error); }
  return { success: false, message: '' };
};

const extractWithRegex = (text: string): { success: boolean; message: string } => {
  const patterns = [
    /"content":"([^"]*)"/g,
    /"message":"([^"]*)"/g,
    /"text":"([^"]*)"/g,
    /"response":"([^"]*)"/g
  ];
  for (const p of patterns) {
    const matches = [...text.matchAll(p)];
    if (matches.length > 0) {
      const extracted = matches.map(m => m[1]).join('\n').replace(/\\n/g, '\n').trim();
      if (extracted.length > 0) return { success: true, message: extracted };
    }
  }
  return { success: false, message: '' };
};
