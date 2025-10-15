// relay-server.js (versão ES modules)
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors({
  origin: "http://localhost:5173",
  credentials: false
}));
app.use(express.json());

// Armazena conexões SSE
const channels = new Map();

// SSE Endpoint - o frontend se conecta aqui
app.get('/sse', (req, res) => {
  const channel = req.query.channel || 'default';
  console.log(`📡 Nova conexão SSE no canal: ${channel}`);

  // Configura headers SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Cria o canal se não existir
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  
  // Adiciona esta conexão ao canal
  channels.get(channel).add(res);

  // Envia ping a cada 25 segundos para manter conexão
  const pingInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(pingInterval);
      return;
    }
    res.write('event: ping\ndata: {}\n\n');
  }, 25000);

  // Envia mensagem de boas-vindas
  const welcomeEvent = {
    event: 'final',
    data: {
      message_id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: '✅ Conectado ao servidor em tempo real! Agora posso te ajudar instantaneamente.',
      latency_ms: 100
    }
  };
  res.write(`data: ${JSON.stringify(welcomeEvent)}\n\n`);

  // Limpeza quando conexão fechar
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

// Ingest Endpoint - recebe mensagens do frontend
app.post('/ingest', (req, res) => {
  const { message_id, session_id, text, user_id } = req.body;
  
  console.log('📨 Mensagem recebida:', { message_id, session_id, text, user_id });
  
  // Resposta imediata para o frontend
  res.status(202).json({ 
    status: 'accepted',
    message: 'Mensagem recebida e sendo processada'
  });

  // Simula processamento em tempo real
  simulateRealTimeProcessing(session_id, message_id, text);
});

// Função que simula o processamento do n8n/IA
function simulateRealTimeProcessing(sessionId, messageId, userText) {
  const channelSet = channels.get(sessionId);
  
  if (!channelSet) {
    console.log(`❌ Canal ${sessionId} não encontrado`);
    return;
  }

  // 1. Envia "digitando..."
  setTimeout(() => {
    const typingEvent = {
      event: 'typing',
      data: { message_id: messageId }
    };
    
    console.log(`✍️ Enviando "digitando..." para ${sessionId}`);
    channelSet.forEach(client => {
      if (!client.writableEnded) {
        client.write(`data: ${JSON.stringify(typingEvent)}\n\n`);
      }
    });

    // 2. Simula processamento e envia resposta
    setTimeout(() => {
      const responses = [
        `Entendi que você disse: "${userText}". Como posso te ajudar com o onboarding?`,
        `Ótima pergunta sobre "${userText}"! Vou te guiar no processo.`,
        `Perfeito! Com base no que você mencionou ("${userText}"), posso te auxiliar.`,
        `Obrigado pela mensagem! Em relação a "${userText}", posso te ajudar.`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const finalEvent = {
        event: 'final',
        data: {
          message_id: messageId,
          role: 'assistant',
          content: randomResponse,
          latency_ms: 2000
        }
      };

      console.log(`✅ Enviando resposta final para ${sessionId}`);
      channelSet.forEach(client => {
        if (!client.writableEnded) {
          client.write(`data: ${JSON.stringify(finalEvent)}\n\n`);
        }
      });
    }, 2000);

  }, 500);
}

// Endpoint de saúde
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    channels: Array.from(channels.keys()),
    connections: Array.from(channels.values()).reduce((acc, set) => acc + set.size, 0)
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Relay Server rodando na porta ${PORT}`);
  console.log(`📡 SSE: http://localhost:${PORT}/sse?channel=seu_canal`);
  console.log(`📨 Ingest: http://localhost:${PORT}/ingest`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});