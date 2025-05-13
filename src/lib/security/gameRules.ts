import { ParsedCommand } from '../ai/gameState';
import { GameState } from '../ai/gameState';

interface GameRules {
  maxUnitsPerPlayer: number;
  maxUnitsPerType: number;
  unitCosts: Record<string, number>;
  cooldowns: Record<string, number>;
  maxCoordinate: number;
  minDistanceBetweenUnits: number;
}

const DEFAULT_RULES: GameRules = {
  maxUnitsPerPlayer: 50,
  maxUnitsPerType: 15,
  unitCosts: {
    scout: 1,
    defender: 2,
    attacker: 3,
    engineer: 2,
    drone: 2,
    tank: 4,
    special_ops: 5,
    medic: 3
  },
  cooldowns: {
    deploy: 2000,    // 2 seconds
    attack: 1000,    // 1 second
    special: 10000,  // 10 seconds
  },
  maxCoordinate: 100,
  minDistanceBetweenUnits: 1
};

// Track last action times per player
const playerActionTimes = new Map<string, Record<string, number>>();

export function validateGameRules(
  command: ParsedCommand, 
  gameState: GameState,
  rules: GameRules = DEFAULT_RULES
): { valid: boolean; reason?: string } {
  const playerUnits = gameState.getAgents().filter(a => a.ownerPlayerId === gameState.playerId);
  
  // Check total unit limit
  if (command.action === 'deploy' && playerUnits.length >= rules.maxUnitsPerPlayer) {
    return {
      valid: false,
      reason: `Maximum unit limit (${rules.maxUnitsPerPlayer}) reached`
    };
  }

  // Check unit type limit
  if (command.action === 'deploy' && command.unitType) {
    const unitsOfType = playerUnits.filter(u => u.type === command.unitType).length;
    const requestedCount = typeof command.count === 'number' ? command.count : 1;
    
    if (unitsOfType + requestedCount > rules.maxUnitsPerType) {
      return {
        valid: false,
        reason: `Maximum ${command.unitType} limit (${rules.maxUnitsPerType}) reached`
      };
    }
  }

  // Check cooldowns
  const playerTimes = playerActionTimes.get(gameState.playerId) || {};
  const now = Date.now();
  const lastActionTime = playerTimes[command.action] || 0;
  const cooldown = rules.cooldowns[command.action as keyof typeof rules.cooldowns] || 0;

  if (now - lastActionTime < cooldown) {
    return {
      valid: false,
      reason: `Action '${command.action}' is on cooldown for ${Math.ceil((cooldown - (now - lastActionTime)) / 1000)}s`
    };
  }

  // Update last action time
  playerActionTimes.set(gameState.playerId, {
    ...playerTimes,
    [command.action]: now
  });

  // Validate coordinates
  if (command.coordinates) {
    if (command.coordinates.x < 0 || command.coordinates.x > rules.maxCoordinate ||
        command.coordinates.y < 0 || command.coordinates.y > rules.maxCoordinate) {
      return {
        valid: false,
        reason: `Coordinates must be between 0 and ${rules.maxCoordinate}`
      };
    }

    // Check minimum distance between units
    const tooClose = playerUnits.some(unit => {
      const dx = unit.position.x - command.coordinates!.x;
      const dy = unit.position.y - command.coordinates!.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < rules.minDistanceBetweenUnits;
    });

    if (tooClose && command.action === 'deploy') {
      return {
        valid: false,
        reason: `Units must be at least ${rules.minDistanceBetweenUnits} units apart`
      };
    }
  }

  // Add more rules as needed:
  // - Resource costs
  // - Tech tree requirements
  // - Line of sight checks
  // - Fog of war
  // - etc.

  return { valid: true };
} 