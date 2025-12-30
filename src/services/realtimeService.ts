// src/services/realtimeService.ts
import { SendMessagePayload, SseEvent } from '../types/chat';

const RELAY_URL = 'http://localhost:3001';

class RealtimeService {
  private eventSource: EventSource | null = null;

  connect(sessionId: string, onEvent: (event: SseEvent) => void): () => void {
    this.disconnect();
    
    const url = `${RELAY_URL}/sse?channel=${sessionId}`;
    console.log(`Connecting to SSE: ${url}`);
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        onEvent(parsedData);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      onEvent({ event: 'error', data: { code: 'CONNECTION_ERROR', detail: 'Falha na conexão com o servidor de tempo real.' } });
      this.disconnect();
    };

    return () => this.disconnect();
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('Disconnected from SSE.');
    }
  }

  async sendMessage(message: string, sessionId: string, userId: string, messageId: string): Promise<void> {
    const payload: SendMessagePayload = {
        message_id: messageId,
        session_id: sessionId,
        user_id: userId,
        text: message,
        ts: new Date().toISOString(),
    };
    
    console.log('Sending message to relay:', payload);

    const response = await fetch(`${RELAY_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to send message: ${errorData.message || response.statusText}`);
    }
  }
}

export const realtimeService = new RealtimeService();