// src/services/realtimeService.ts
export class RealtimeService {
  private eventSource: EventSource | null = null;

  connect(sessionId: string, onMessage: (data: any) => void) {
    this.disconnect();
    
    // Para desenvolvimento, simula conexão
    console.log(`Conectando ao canal: ${sessionId}`);
    
    // Simula mensagens em tempo real
    setTimeout(() => {
      onMessage({
        event: 'connected',
        data: { message: 'Conectado ao servidor' }
      });
    }, 1000);

    return () => this.disconnect();
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  async sendMessage(message: string, sessionId: string): Promise<void> {
    // Simula envio para servidor
    console.log('Enviando mensagem:', { message, sessionId });
    
    // Em produção, aqui iria a chamada real para o relay server
    return new Promise(resolve => setTimeout(resolve, 100));
  }
}

export const realtimeService = new RealtimeService();