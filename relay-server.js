// relay-server.js (versão ES modules)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = 3001;

// --- Configuração do Google Gemini ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ ERRO: A variável de ambiente GEMINI_API_KEY não está definida.");
  console.error("Por favor, crie um arquivo .env e adicione sua chave da API Gemini.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "Você é o OnBot, um assistente de IA amigável e prestativo da OnMidia. Sua função é ajudar os usuários a navegar e utilizar as ferramentas da plataforma. Seja conciso e direto em suas respostas.",
});
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
// ------------------------------------

// Middlewares
app.use(cors());
app.use(express.json());

// Armazena conexões SSE (Server-Sent Events)
const channels = new Map();

// Endpoint SSE - o frontend se conecta aqui para receber eventos
app.get('/sse', (req, res) => {
  const channelId = req.query.channel;
  if (!channelId) {
    return res.status(400).json({ error: 'O parâmetro "channel" é obrigatório' });
  }
  console.log(`📡 Nova conexão SSE no canal: ${channelId}`);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  if (!channels.has(channelId)) {
    channels.set(channelId, new Set());
  }
  channels.get(channelId).add(res);

  const pingInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(pingInterval);
      return;
    }
    res.write('event: ping\ndata: {}\n\n');
  }, 25000);

  req.on('close', () => {
    console.log(`❌ Conexão fechada no canal: ${channelId}`);
    clearInterval(pingInterval);
    const channelSet = channels.get(channelId);
    if (channelSet) {
      channelSet.delete(res);
      if (channelSet.size === 0) {
        channels.delete(channelId);
      }
    }
  });
});

// Endpoint de Ingestão - recebe mensagens do frontend e envia para o Gemini
app.post('/ingest', async (req, res) => {
  const { session_id, text, user_id, message_id, history } = req.body;
  console.log('📨 Mensagem recebida do FE:', { session_id, text });

  if (!session_id || !text) {
    return res.status(400).json({ error: 'session_id e text são obrigatórios' });
  }
  
  // Confirma o recebimento da mensagem imediatamente
  res.status(202).json({ status: 'accepted' });

  // Envia "digitando..." para o cliente
  sendEventToChannel(session_id, { event: 'typing', data: { message_id } });

  try {
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: history || [], // Usa o histórico enviado pelo cliente, se houver
    });
    
    const result = await chat.sendMessageStream(text);

    let fullResponse = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      // Envia cada pedaço (chunk) para o cliente em tempo real
      sendEventToChannel(session_id, { 
        event: 'chunk', 
        data: { message_id, content: chunkText }
      });
    }
    
    // Envia o evento final com a resposta completa
    sendEventToChannel(session_id, {
      event: 'final',
      data: {
        message_id,
        role: 'assistant',
        content: fullResponse,
      },
    });

  } catch (error) {
    console.error('🔥 Erro ao chamar a API Gemini:', error);
    sendEventToChannel(session_id, { 
      event: 'error', 
      data: { 
        code: 'GEMINI_API_ERROR', 
        detail: 'Ocorreu um erro ao processar sua solicitação com a IA.' 
      } 
    });
  }
});

function sendEventToChannel(channelId, event) {
  const channelSet = channels.get(channelId);
  if (channelSet) {
    // console.log(`📢 Enviando evento "${event.event}" para o canal ${channelId}`);
    const eventString = `data: ${JSON.stringify(event)}\n\n`;
    channelSet.forEach(client => {
      if (!client.writableEnded) {
        client.write(eventString);
      }
    });
  } else {
    console.log(`⚠️ Canal ${channelId} não encontrado para enviar evento.`);
  }
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Relay Server rodando na porta ${PORT}`);
  console.log("🔑 Usando a chave da API Gemini que termina com: ...", GEMINI_API_KEY.slice(-4));
  console.log("🤖 Modelo de IA configurado: gemini-1.5-flash");
});