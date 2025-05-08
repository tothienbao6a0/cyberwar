import { Server } from 'socket.io';
import { wsManager } from '@/lib/security/websocket';
import { gameStateManager } from '@/lib/game/gameStateManager';

interface GameCommand {
  type: 'command';
  payload: {
    text: string;
    action: string;
    timestamp: number;
  };
  timestamp: number;
  signature: string;
  clientId: string;
  sequence: number;
}

const SocketHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', async (socket) => {
      const token = socket.handshake.auth.token;
      const isValid = await wsManager.handleConnection(socket as any, token);

      if (!isValid) {
        socket.disconnect();
        return;
      }

      // Initialize game state for new player
      const playerId = socket.id;
      gameStateManager.initializeGame(playerId);

      socket.on('command', async (rawCommand: unknown) => {
        try {
          // Parse and validate command
          const command = rawCommand as GameCommand;
          
          if (!command.payload?.text || typeof command.payload.text !== 'string') {
            socket.emit('error', 'Invalid command format');
            return;
          }

          const validation = wsManager.validateMessage(command);
          if (!validation.valid) {
            socket.emit('error', validation.error);
            return;
          }

          // Process the command
          const success = await gameStateManager.processCommand(playerId, command);
          if (!success) {
            socket.emit('error', 'Command processing failed');
          }
        } catch (error) {
          console.error('Command processing error:', error);
          socket.emit('error', 'Internal server error');
        }
      });

      socket.on('disconnect', () => {
        wsManager.disconnectClient(playerId);
      });
    });

    // Start game loop
    setInterval(() => {
      gameStateManager.update();
    }, 100); // 10 times per second
  }
  res.end();
};

export default SocketHandler; 