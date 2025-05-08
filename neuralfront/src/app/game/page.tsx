import { useGameSocket } from './useGameSocket';

export default function GamePage() {
  const { isConnected, gameState, sendCommand } = useGameSocket();

  const handleCommand = (command: string) => {
    sendCommand(command);
  };

  if (!isConnected) {
    return <div>Connecting to game server...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">NEURALFRONT</h1>
        <p>Resources: {JSON.stringify(gameState?.resources)}</p>
      </div>

      {/* Game canvas goes here */}
      <div className="w-full h-[600px] bg-gray-800 rounded-lg mb-4">
        {/* Your game rendering code */}
      </div>

      {/* Command input */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-gray-800 text-white p-2 rounded"
          placeholder="Enter command..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCommand(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  );
} 