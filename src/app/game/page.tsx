'use client';

import { useGameSocket } from './useGameSocket';
import { Battlefield } from '@/components/Battlefield';
import { useEffect, useState } from 'react';
import { Agent } from '@/lib/ai/agent';

export default function GamePage() {
  const { isConnected, gameState, sendCommand } = useGameSocket();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on window resize
  useEffect(() => {
    function handleResize() {
      // Calculate dimensions based on window size
      // Subtract padding and other elements' height
      const height = window.innerHeight - 160; // Account for header and input
      const width = window.innerWidth - 300; // Account for log window
      setDimensions({ width, height });
    }

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCommand = (command: string) => {
    sendCommand(command);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neuralfront-bg text-white">
        <div className="text-center">
          <h2 className="text-2xl font-orbitron mb-4">NEURALFRONT</h2>
          <p className="text-neuralfront-accent-cyan">Connecting to game server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neuralfront-bg text-white">
      {/* Main game area */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-orbitron font-bold text-neuralfront-accent-cyan">NEURALFRONT</h1>
          <p className="text-sm text-neuralfront-ai-green">Resources: {JSON.stringify(gameState?.resources)}</p>
        </div>

        {/* Game canvas */}
        <div className="rounded-lg overflow-hidden border border-neuralfront-borders-lines">
          {dimensions.width > 0 && dimensions.height > 0 && (
            <Battlefield
              agents={gameState?.agents || []}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}
        </div>

        {/* Command input */}
        <div className="mt-4">
          <input
            type="text"
            className="w-full bg-[#0A0F14] text-white p-3 rounded border border-neuralfront-borders-lines focus:border-neuralfront-accent-cyan focus:outline-none font-chakra-petch"
            placeholder="Enter command... (e.g., 'deploy 2 scouts at coordinates 10, 20')"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommand(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Agent log sidebar */}
      <div className="w-[300px] bg-[#0A0F14] p-4 border-l border-neuralfront-borders-lines overflow-y-auto">
        <h2 className="text-lg font-orbitron mb-4 text-neuralfront-accent-cyan">Agent Log</h2>
        <div className="space-y-2">
          {gameState?.agents.map((agent: Agent) => (
            <div 
              key={agent.id}
              className="p-2 rounded bg-[#151B22] border border-neuralfront-borders-lines"
            >
              <div className="flex items-center justify-between">
                <span className="font-chakra-petch text-sm">{agent.type}</span>
                <span className="text-xs text-neuralfront-accent-cyan">ID: {agent.id}</span>
              </div>
              <div className="text-xs mt-1 text-gray-400">
                Position: ({agent.position.x}, {agent.position.y})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 