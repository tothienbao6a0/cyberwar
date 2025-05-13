'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChat } from 'ai/react';
import React, { useState, useEffect, useMemo, useRef } from "react";

import { GameState, ParsedCommand } from "@/lib/ai/gameState";
import { processCommand } from "@/lib/ai/commandProcessor";
import { Agent } from "@/lib/ai/agent";
import { Battlefield } from "@/components/Battlefield";

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error: apiError } = useChat({
    api: '/api/interpret-command',
    onError: (error) => {
      console.error("Chat Error:", error);
    },
    onResponse: (response) => {
      console.log("API Response:", response);
    },
    streamProtocol: 'data'
  });

  const [parsedLLMCommand, setParsedLLMCommand] = useState<ParsedCommand | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Initialize GameState using useMemo to ensure it's created only once per client session
  const gameState = useMemo(() => new GameState("player1"), []);

  // State to trigger re-render when gameState logs or agents change
  const [actionLogs, setActionLogs] = useState<string[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Add state and ref for battlefield container dimensions
  const battlefieldContainerRef = useRef<HTMLDivElement>(null);
  const [battlefieldDimensions, setBattlefieldDimensions] = useState({ width: 0, height: 0 });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return; // Don't submit empty commands
    
    setParsedLLMCommand(null);
    setProcessingError(null);
    
    handleSubmit(e, {
      body: {
        prompt: input.trim()
      }
    });
  };

  // Effect to parse the latest assistant message (LLM output) as JSON
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
      try {
        // Clean the response: remove any non-JSON content and find the JSON object
        let content = lastMessage.content.trim();
        
        // Try to find a JSON object in the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn("No JSON object found in response:", content);
          throw new Error('No JSON object found in response');
        }
        
        let jsonStr = jsonMatch[0];
        
        // Handle potential streaming artifacts
        if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```json\n|\n```|```/g, '');
        }
        
        const jsonContent: ParsedCommand = JSON.parse(jsonStr.trim());
        
        // Validate required fields
        if (!jsonContent.action) {
          throw new Error('Invalid command: missing required "action" field');
        }
        
        setParsedLLMCommand(jsonContent);
        setProcessingError(null);

        // Now process this command with the game state
        processCommand(jsonContent, gameState);
        
        // Update local state to reflect changes in gameState for UI re-render
        setActionLogs(gameState.getActionLogs());
        setAgents(gameState.getAgents());

      } catch (e) {
        console.error("Failed to parse assistant message as JSON or process command:", e);
        const errorDetails = e instanceof Error ? e.message : String(e);
        setParsedLLMCommand(null);
        setProcessingError(`Failed to parse command: ${errorDetails}`);
        setActionLogs(gameState.getActionLogs()); // Still update logs if any processing happened before error
        setAgents(gameState.getAgents());
      }
    }
  }, [messages, gameState]); // Depend on messages and gameState

  // Update battlefield dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (battlefieldContainerRef.current) {
        setBattlefieldDimensions({
          width: battlefieldContainerRef.current.clientWidth,
          height: battlefieldContainerRef.current.clientHeight
        });
      }
    };

    // Initial size
    updateDimensions();

    // Listen for window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <main className="flex flex-col h-screen bg-neuralfront-bg text-neutral-50 p-4 selection:bg-neuralfront-accent-cyan selection:text-neuralfront-bg">
      <header className="flex-shrink-0 p-2 border-b border-neuralfront-borders-lines">
        <h1 className="text-2xl font-orbitron text-neuralfront-accent-cyan text-center">
          NEURALFRONT
        </h1>
      </header>

      <div className="flex flex-1 mt-4 overflow-hidden space-x-2">
        <aside className="w-1/3 p-2 border border-neuralfront-borders-lines rounded-md bg-neuralfront-bg/50 backdrop-blur-sm overflow-y-auto flex flex-col">
          <h2 className="text-lg font-orbitron text-neuralfront-ai-green mb-2 sticky top-0 bg-neuralfront-bg/80 py-1 px-1">AGENT LOGS & STATE</h2>
          
          {apiError && (
            <div className="mt-1 p-2 border border-neuralfront-alert-red rounded-md bg-red-900/30 text-xs">
              <h3 className="font-bold text-neuralfront-alert-red">API Error:</h3>
              <pre className="whitespace-pre-wrap">{JSON.stringify((apiError as any).message || apiError, null, 2)}</pre>
            </div>
          )}
          {processingError && (
             <div className="mt-1 p-2 border border-neuralfront-alert-red rounded-md bg-red-900/30 text-xs">
              <h3 className="font-bold text-neuralfront-alert-red">Processing Error:</h3>
              <p className="whitespace-pre-wrap">{processingError}</p>
            </div>
          )}
          {parsedLLMCommand && (
            <div className="mt-1 p-2 border border-neuralfront-accent-cyan/50 rounded-md bg-cyan-900/20 text-xs">
              <h3 className="font-bold text-neuralfront-accent-cyan">LLM Parsed Command:</h3>
              <pre className="whitespace-pre-wrap">{JSON.stringify(parsedLLMCommand, null, 2)}</pre>
            </div>
          )}

          <div className="mt-2 flex-grow overflow-y-auto text-xs font-oxanium space-y-1 pr-1">
            <h3 className="font-bold text-neuralfront-ai-green mt-1">Game Action Logs:</h3>
            {actionLogs.length > 0 ? (
              actionLogs.slice().reverse().map((log, index) => (
                <p key={index} className="break-words">{log}</p>
              ))
            ) : (
              <p>No game actions yet. (Or waiting for client hydration)</p>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-neuralfront-borders-lines/50 overflow-y-auto text-xs">
            <h3 className="font-bold text-neuralfront-ai-green">Current Agents ({agents.length}):</h3>
            {agents.map(agent => (
              <div key={agent.id} className="mt-1 p-1 border border-neuralfront-borders-lines/30 rounded-sm bg-neuralfront-bg/30">
                <p>ID: <span className="text-neuralfront-accent-cyan">{agent.id.substring(0,8)}</span> Type: <span className="text-yellow-400">{agent.type}</span></p>
                <p>Pos: (X: {agent.position.x}, Y: {agent.position.y}) Status: <span className="text-green-400">{agent.status}</span> HP: {agent.health}</p>
                {agent.destination && <p>Dest: (X: {agent.destination.x}, Y: {agent.destination.y})</p>}
                {agent.targetId && <p>Target: {agent.targetId.substring(0,8)}</p>}
              </div>
            ))}
            {agents.length === 0 && <p>No agents deployed.</p>}
          </div>
        </aside>

        <section ref={battlefieldContainerRef} className="flex-1 flex items-center justify-center border border-neuralfront-borders-lines rounded-md bg-black/30 overflow-hidden">
          {battlefieldDimensions.width > 0 && battlefieldDimensions.height > 0 && (
            <Battlefield
              agents={agents}
              width={battlefieldDimensions.width}
              height={battlefieldDimensions.height}
            />
          )}
        </section>

        <aside className="w-1/4 p-2 border border-neuralfront-borders-lines rounded-md bg-neuralfront-bg/50 backdrop-blur-sm overflow-y-auto">
          <h2 className="text-lg font-orbitron text-neuralfront-alert-red mb-2 sticky top-0 bg-neuralfront-bg/80 py-1 px-1">SYSTEM ALERTS</h2>
          <div className="text-sm font-oxanium space-y-1">
            <p><span className="text-neuralfront-accent-cyan">[timestamp]</span> Enemy reinforcement detected!</p>
          </div>
        </aside>
      </div>

      <footer className="flex-shrink-0 p-4 mt-4 border-t border-neuralfront-borders-lines">
        <form onSubmit={handleFormSubmit} className="flex space-x-2">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter command (e.g., 'Deploy 2 scouts at 10,20')"
            className="flex-1 bg-transparent border-neuralfront-borders-lines focus:border-neuralfront-accent-cyan focus:ring-neuralfront-accent-cyan placeholder:text-neuralfront-borders-lines/70 font-chakra-petch text-neuralfront-accent-cyan disabled:opacity-70"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="outline"
            className="font-orbitron bg-transparent border-neuralfront-accent-cyan text-neuralfront-accent-cyan hover:bg-neuralfront-accent-cyan hover:text-neuralfront-bg disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? 'INTERPRETING...' : 'DISPATCH'}
          </Button>
        </form>
      </footer>
    </main>
  );
} 