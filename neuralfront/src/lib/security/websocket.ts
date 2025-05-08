import { z } from 'zod';
import { verifyToken } from './auth';

// WebSocket message validation schema
export const WebSocketMessageSchema = z.object({
  type: z.enum(['command', 'sync', 'resource', 'tech', 'chat']),
  payload: z.any(),
  timestamp: z.number(),
  signature: z.string(),
  clientId: z.string(),
  sequence: z.number()
});

type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private messageSequences: Map<string, number> = new Map();
  private lastMessageTimestamp: Map<string, number> = new Map();
  
  // Rate limiting
  private static readonly MAX_MESSAGES_PER_SECOND = 10;
  private static readonly MESSAGE_WINDOW_MS = 1000;

  validateMessage(message: unknown): { valid: boolean; error?: string } {
    try {
      const parsed = WebSocketMessageSchema.parse(message);
      const clientId = parsed.clientId;

      // Check sequence number to prevent replay attacks
      const lastSequence = this.messageSequences.get(clientId) || 0;
      if (parsed.sequence <= lastSequence) {
        return { valid: false, error: 'Invalid message sequence' };
      }

      // Rate limiting
      const now = Date.now();
      const lastTimestamp = this.lastMessageTimestamp.get(clientId) || 0;
      if (now - lastTimestamp < WebSocketManager.MESSAGE_WINDOW_MS) {
        return { valid: false, error: 'Rate limit exceeded' };
      }

      // Validate timestamp to prevent replay attacks
      const messageAge = now - parsed.timestamp;
      if (messageAge > 5000 || messageAge < -5000) { // 5 second tolerance
        return { valid: false, error: 'Invalid message timestamp' };
      }

      // Update tracking
      this.messageSequences.set(clientId, parsed.sequence);
      this.lastMessageTimestamp.set(clientId, now);

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid message format' };
    }
  }

  async handleConnection(ws: WebSocket, token: string): Promise<boolean> {
    try {
      const userId = await verifyToken(token);
      if (!userId) return false;

      const clientId = `${userId}-${Date.now()}`;
      this.connections.set(clientId, ws);

      ws.onclose = () => {
        this.connections.delete(clientId);
        this.messageSequences.delete(clientId);
        this.lastMessageTimestamp.delete(clientId);
      };

      return true;
    } catch {
      return false;
    }
  }

  broadcastToRoom(roomId: string, message: WebSocketMessage): void {
    // Implement room-based broadcasting
  }

  disconnectClient(clientId: string): void {
    const ws = this.connections.get(clientId);
    if (ws) {
      ws.close();
      this.connections.delete(clientId);
    }
  }
}

export const wsManager = new WebSocketManager(); 