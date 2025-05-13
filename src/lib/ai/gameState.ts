import { Agent } from './agent';
import { UnitType, UnitActionStatus } from './enums';
import { v4 as uuidv4 } from 'uuid';

// This will be the expected structure of parsed commands from the LLM
// We'll refine this as we go, ensuring it matches the LLM output from api/interpret-command/route.ts
export interface ParsedCommand {
  action: string;
  unitType?: UnitType | string; // Allow string for flexibility if LLM doesn't strictly use enum value
  unitId?: string;
  count?: number | string; // e.g., "all"
  direction?: string;
  target?: string; // Can be a unit ID, sector name, or general description like "enemy_structure"
  coordinates?: { x: number; y: number };
  priority?: string;
  formation?: string;
  specialAbility?: string;
}

export class GameState {
  public agents: Map<string, Agent>; // Key is agent ID
  private actionLogs: string[];
  private playerId: string; // To simulate which player this game state belongs to

  constructor(playerId: string = "player1") {
    this.agents = new Map<string, Agent>();
    this.actionLogs = [];
    this.playerId = playerId;
    this.log("Game state initialized for player: " + playerId);
  }

  public log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.actionLogs.push(`[${timestamp}] ${message}`);
    console.log(`[GameState] ${message}`);
  }

  public getActionLogs(): string[] {
    return [...this.actionLogs]; // Return a copy
  }

  public getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Example method to add an agent (used by 'deploy' or initial setup)
  public addAgent(type: UnitType, position: { x: number; y: number }, count: number = 1): Agent[] {
    const newAgents: Agent[] = [];
    const spacing = 2; // Two grid cells spacing between units

    for (let i = 0; i < count; i++) {
      // Calculate offset position for multiple units in a more spread out formation
      const offsetPosition = {
        x: Math.max(0, position.x + (i % 3) * spacing), // Arrange in a 3xN grid
        y: Math.max(0, position.y + Math.floor(i / 3) * spacing)
      };

      const newAgent: Agent = {
        id: uuidv4(),
        ownerPlayerId: this.playerId,
        type,
        position: offsetPosition,
        health: 100,
        maxHealth: 100,
        status: UnitActionStatus.IDLE,
        lastUpdated: Date.now(),
      };
      this.agents.set(newAgent.id, newAgent);
      newAgents.push(newAgent);
      this.log(`Deployed ${type} unit ${newAgent.id.substring(0,8)} at (${offsetPosition.x}, ${offsetPosition.y})`);
    }
    return newAgents;
  }

  // Placeholder for other agent manipulation methods (move, attack etc.)
  public moveAgent(agentId: string, newPosition: { x: number; y: number }) {
    const agent = this.agents.get(agentId);
    if (agent) {
      // Ensure coordinates are non-negative
      const safePosition = {
        x: Math.max(0, newPosition.x),
        y: Math.max(0, newPosition.y)
      };
      
      agent.position = safePosition;
      agent.status = UnitActionStatus.MOVING;
      agent.destination = safePosition;
      agent.lastUpdated = Date.now();
      this.agents.set(agentId, agent);
      this.log(`Agent ${agentId.substring(0,8)} is now MOVING to (${safePosition.x}, ${safePosition.y})`);
    } else {
      this.log(`Error: Agent ${agentId} not found for move command.`);
    }
  }

  // More methods will be added here by the command processor
} 