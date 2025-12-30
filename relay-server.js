// relay-server.js (versão ES modules)
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = 3001;
const N8N_WEBHOOK_URL = process.env.VITE_N8N_WEBHOOK_URL;

if (!N8N_WEBHOOK_URL) {
  console.error("❌ ERRO: A variável de ambiente VITE_N8N_WEBHOOK_URL não está definida.");
  console.error("Por favor, crie um arquivo .env e adicione a URL do webhook.");
  process.exit(1);
}

// Middlewares
app.use(cors()); // Simplificado para permitir todas as origens durante o desenvolvimento
app.use(express.json());

// Armazena conexões SSE
const channels = new Map();

// SSE Endpoint - o frontend se conecta aqui
app.get('/sse', (req, res) => {
  const channel = req.query.channel;
  if (!channel) {
    return res.status(400).json({ error: 'Channel query parameter is required' });
  }
  console.log(`📡 Nova conexão SSE no canal: ${channel}`);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  channels.get(channel).add(res);

  const pingInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(pingInterval);
      return;
    }
    res.write('event: ping\ndata: {}\n\n');
  }, 25000);

  req.on('close', () => {
    console.log(`❌ Conexão fechada no canal: ${channel}`);
    clearInterval(pingInterval);
    const channelSet = channels.get(channel);
    if (channelSet) {
      channelSet.delete(res);
      if (channelSet.size === 0) {
        channels.delete(channel);
      }
    }
  });
});

// Ingest Endpoint - recebe mensagens do frontend e envia para o n8n
app.post('/ingest', async (req, res) => {
  const { session_id, text, user_id, message_id } = req.body;
  console.log('📨 Mensagem recebida do FE:', { session_id, text });

  if (!session_id || !text) {
    return res.status(400).json({ error: 'session_id and text are required' });
  }

  // Envia "digitando..." para o cliente
  sendEventToChannel(session_id, { event: 'typing', data: { message_id } });

  try {
    // Requisita o webhook do n8n
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id, // Passa o session_id para o n8n poder chamar de volta
            text,
            user_id,
            message_id,
        }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`❌ Erro ao chamar o webhook do n8n: ${webhookResponse.status} ${errorText}`);
      sendEventToChannel(session_id, { event: 'error', data: { code: 'WEBHOOK_ERROR', detail: 'Ocorreu um erro ao processar sua solicitação.' } });
    }
    
    // n8n irá processar e chamar o endpoint /n8n-callback
    res.status(202).json({ status: 'accepted' });

  } catch (error) {
    console.error('🔥 Erro fatal no /ingest:', error);
    sendEventToChannel(session_id, { event: 'error', data: { code: 'INTERNAL_ERROR', detail: 'Erro interno no servidor de relay.' } });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Callback Endpoint - recebe a resposta do n8n e envia para o cliente
app.post('/n8n-callback', (req, res) => {
  const { session_id, message_id, content } = req.body;
  console.log('🗣️ Resposta recebida do n8n:', { session_id, content });

  if (!session_id || !content) {
    return res.status(400).json({ error: 'session_id and content are required' });
  }

  const finalEvent = {
    event: 'final',
    data: {
      message_id: message_id || `assistant_${Date.now()}`,
      role: 'assistant',
      content: content,
    }
  };

  sendEventToChannel(session_id, finalEvent);

  res.status(200).json({ status: 'sent_to_client' });
});

function sendEventToChannel(channelId, event) {
  const channelSet = channels.get(channelId);
  if (channelSet) {
    console.log(`📢 Enviando evento "${event.event}" para o canal ${channelId}`);
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
});