import { Server, Socket } from 'socket.io';
import { wsManager } from '@/lib/security/websocket';
import { gameStateManager } from '@/lib/game/gameStateManager';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ClientToServerCommand {
  type: 'command';
  payload: {
    text: string;
    action: string; // Will be 'interpret'
    timestamp: number;
  };
  timestamp: number;
  signature: string; // Placeholder for now
  clientId: string;
  sequence: number;
}

// This is the structure expected by the /api/interpret-command route
interface InterpretCommandApiRequest {
  payload: {
    text: string;
  };
  gameState?: any; // Optional current game state for validation by the API
}

// This is the expected structure of a successfully interpreted command
// (Based on the system prompt in interpret-command/route.ts)
interface InterpretedCommand {
  action: string;
  unitType?: string;
  unitId?: string;
  count?: number;
  direction?: string;
  target?: string;
  coordinates?: { x: number; y: number };
  priority?: string;
  formation?: string;
  specialAbility?: string;
  // ... any other fields the AI might return
}

// Augment the NextApiResponse to include the socket server
interface SocketApiResponse extends NextApiResponse {
  socket: NextApiResponse['socket'] & {
    server: any & { // Use intersection type for broader compatibility
      io?: Server; // Optional IO server instance
    }
  };
}

const SocketHandler = (req: NextApiRequest, res: SocketApiResponse) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting Socket.IO server...');
    const io = new Server(res.socket.server as any, {
      path: '/api/socket', // Use the API route path itself
    });
    res.socket.server.io = io;

    io.on('connection', async (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);
      const token = socket.handshake.auth.token;
      // Cast to any for now, ideally wsManager should handle SocketIO socket type
      const isValidConnection = await wsManager.handleConnection(socket as any, token);

      if (!isValidConnection) {
        console.log(`Invalid connection attempt from ${socket.id}`);
        socket.disconnect();
        return;
      }

      const playerId = socket.id;
      gameStateManager.initializeGame(playerId); // Assuming this initializes and possibly broadcasts initial state
      console.log(`Player ${playerId} initialized.`);

      socket.on('command', async (rawCommand: unknown) => {
        console.log(`Received command from ${playerId}:`, rawCommand);
        try {
          const clientCommand = rawCommand as ClientToServerCommand;

          if (!clientCommand.payload?.text || typeof clientCommand.payload.text !== 'string') {
            socket.emit('error', { message: 'Invalid command format: Missing text payload.' });
            return;
          }

          const validation = wsManager.validateMessage(clientCommand); // Basic message validation
          if (!validation.valid) {
            socket.emit('error', { message: validation.error || 'Invalid command structure.' });
            return;
          }

          const commandText = clientCommand.payload.text;

          // Construct the absolute URL for the API route
          // In a real deployment, this should come from an environment variable
          const interpretApiUrl = process.env.NEXT_PUBLIC_APP_URL 
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/interpret-command` 
            : 'http://localhost:3000/api/interpret-command'; // Fallback for local dev
          
          console.log(`Calling interpret API: ${interpretApiUrl} for command: "${commandText}"`);

          // Match the structure expected by the API route's internal CommandRequest interface
          const apiRequestBody = {
            type: 'interpret_request', // Added placeholder type
            payload: { 
              text: commandText,
              action: 'interpret', // Added placeholder action
              timestamp: Date.now() // Added placeholder timestamp
            },
            // Optionally pass current game state if API needs it for rule validation phase
            // gameState: gameStateManager.getGameStateForPlayer(playerId) // Or however you get current state
          };

          // Add AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

          try {
            const response = await fetch(interpretApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Potentially add an internal API key if this route is not publicly rate-limited for internal calls
              },
              body: JSON.stringify(apiRequestBody),
              signal: controller.signal // Pass the signal to fetch
            });
            clearTimeout(timeoutId); // Clear timeout if fetch completes in time

            if (!response.ok) {
              // Define a type for potential error structure
              type ApiErrorData = { message: string; error?: string; details?: any };

              let errorData: ApiErrorData = { message: `Interpret API failed with status: ${response.status}` };
              try {
                // Try to parse JSON error first
                const jsonError = await response.json();
                errorData = { ...errorData, ...jsonError }; 
              } catch (parseError) {
                // If JSON parsing fails, log the raw text response
                const textError = await response.text();
                console.error('Interpret API non-JSON error response:', textError);
                errorData.message += ` - ${textError.substring(0, 100)}`; // Add snippet to message
              }
              console.error('Interpret API Error:', response.status, errorData);
              socket.emit('error', { 
                message: `Command interpretation failed: ${errorData.error || errorData.message || response.statusText}`,
                details: errorData.details
              });
              return;
            }

            const interpretedCommand: InterpretedCommand = await response.json();
            console.log(`Interpreted command for ${playerId}:`, interpretedCommand);

            // Now process the structured command with the game state manager
            const success = await gameStateManager.processCommand(playerId, interpretedCommand);
            if (success) {
               console.log(`Command processed successfully for ${playerId}.`);
               // gameStateManager.update() will eventually broadcast new state via setInterval
            } else {
              console.error(`Command processing failed for ${playerId}.`);
              socket.emit('error', { message: 'Command processing failed by game manager.' });
            }
          } catch (fetchError: any) {
             clearTimeout(timeoutId); // Ensure timeout is cleared on error too
             if (fetchError.name === 'AbortError') {
               console.error('Interpret API call timed out after 30 seconds.');
               socket.emit('error', { message: 'Command interpretation timed out.' });
             } else {
               console.error('Fetch error calling Interpret API:', fetchError);
               socket.emit('error', { message: 'Failed to communicate with interpretation service.' });
             }
             return; // Stop processing on fetch error
          }

        } catch (error: any) {
          console.error('Command processing error in socket handler:', error);
          socket.emit('error', { message: error.message || 'Internal server error processing command.' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        wsManager.disconnectClient(playerId);
        // gameStateManager.removePlayer(playerId); // Ensure player state is cleaned up - Method might not exist
      });
    });

    // Start the game loop (which handles state updates and broadcasting internally)
    // if (!gameStateManager.isLoopRunning()) { // Prevent multiple loops - Method might not exist
      console.log('Starting game state update loop (via setInterval).');
      setInterval(() => {
        // gameStateManager.update() handles state updates and broadcasting via wsManager
        gameStateManager.update(); 
      }, 100); // e.g., 10 times per second
    // }

  } else {
    console.log('Socket.IO server already running.');
  }
  res.end();
};

export default SocketHandler; 