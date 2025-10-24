// api/n8n-webhook.js
import { sendToSession } from './src/api/websocket-server.js';

// 🔐 TOKEN FIXO - Você pode mudar depois
const EXPECTED_TOKEN = 'zyobpHbtZ6uD4KI8OIL9BZjIaDrQZrl7Oqa6o9X4DX7YPRbqemi9HdBrRpQgCgUTH';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, response, authorization } = req.body;

    console.log('📨 Webhook received:', { sessionId, authorization: authorization?.substring(0, 20) + '...' });

    // 🔒 VERIFICAÇÃO DO TOKEN
    if (!authorization || authorization !== `Bearer ${EXPECTED_TOKEN}`) {
      console.log('❌ Unauthorized request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // ✅ ENVIAR VIA WEBSOCKET
    const messageContent = typeof response === 'string' ? response : JSON.stringify(response);
    const success = sendToSession(sessionId, messageContent);

    console.log(`📤 WebSocket send result: ${success} for session: ${sessionId}`);

    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Message sent via WebSocket',
        sessionId 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'No active WebSocket connection for this session',
        sessionId 
      });
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}