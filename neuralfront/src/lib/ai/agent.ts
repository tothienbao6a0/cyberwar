import { UnitType, UnitActionStatus } from './enums';

export interface Agent {
  id: string; // Unique identifier for the agent
  ownerPlayerId: string; // ID of the player who owns this agent
  type: UnitType;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  status: UnitActionStatus;
  targetId?: string | null; // ID of the target unit or object, if any
  destination?: { x: number; y: number } | null; // Target coordinates for movement
  customData?: Record<string, any>; // For any other agent-specific data
  lastUpdated: number; // Timestamp of the last update
} 