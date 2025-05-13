import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const messageSequence = useRef(0);

  useEffect(() => {
    // Connect to WebSocket, explicitly setting the path
    // Pass undefined as URI to connect to the default host/port
    socketRef.current = io(undefined, {
      path: '/api/socket', // Match the server path
      auth: {
        token: 'dummy-token' // In production, use real auth token
      }
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('state_update', (state) => {
      setGameState(state);
    });

    socketRef.current.on('error', (error) => {
      console.error('Game error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendCommand = (commandText: string) => {
    if (!socketRef.current?.connected) return;

    const command: GameCommand = {
      type: 'command',
      payload: {
        text: commandText,
        action: 'interpret',
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      signature: 'dummy-signature',
      clientId: socketRef.current.id || '',
      sequence: messageSequence.current++
    };

    // Ensure the command is serializable
    const serializedCommand = JSON.parse(JSON.stringify(command));
    socketRef.current.emit('command', serializedCommand);
  };

  return {
    isConnected,
    gameState,
    sendCommand
  };
} 