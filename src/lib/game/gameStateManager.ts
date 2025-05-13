import { resourceManager } from './resources';
import { visibilityManager } from './visibility';
import { antiCheatSystem } from '../security/anticheat';
import { wsManager } from '../security/websocket';

interface GameState {
  playerId: string;
  units: Map<string, any>;
  resources: any;
  techProgress: Set<string>;
  lastUpdate: number;
}

export class GameStateManager {
  private games: Map<string, GameState> = new Map();
  private static readonly UPDATE_INTERVAL = 100; // 10 updates per second

  initializeGame(playerId: string): void {
    resourceManager.initializePlayer(playerId);
    
    this.games.set(playerId, {
      playerId,
      units: new Map(),
      resources: resourceManager.getResources(playerId),
      techProgress: resourceManager.getTechProgress(playerId),
      lastUpdate: Date.now()
    });
  }

  processCommand(playerId: string, command: any): boolean {
    // Validate command through anti-cheat
    if (!antiCheatSystem.validateAction(playerId, command)) {
      return false;
    }

    // Check visibility for targeted actions
    if (command.targetId && !visibilityManager.validateVisibilityClaim(playerId, command.targetId)) {
      return false;
    }

    // Validate resources and tech requirements
    if (command.type === 'deploy') {
      const costs = this.getCommandCosts(command);
      if (!resourceManager.canAfford(playerId, costs)) {
        return false;
      }
    }

    // Process the command
    this.executeCommand(playerId, command);
    return true;
  }

  private getCommandCosts(command: any): any {
    // Define costs for different commands/units
    const costs: Record<string, any> = {
      scout: { credits: 100, energy: 10 },
      defender: { credits: 200, energy: 20 },
      attacker: { credits: 300, energy: 30 },
      // Add more unit costs
    };

    return costs[command.unitType] || {};
  }

  private executeCommand(playerId: string, command: any): void {
    const gameState = this.games.get(playerId);
    if (!gameState) return;

    switch (command.type) {
      case 'deploy':
        this.handleDeploy(playerId, command);
        break;
      case 'move':
        this.handleMove(playerId, command);
        break;
      case 'attack':
        this.handleAttack(playerId, command);
        break;
      // Add more command handlers
    }

    // Update state snapshot for anti-cheat
    antiCheatSystem.addStateSnapshot(playerId, {
      timestamp: Date.now(),
      resources: gameState.resources,
      units: Object.fromEntries(gameState.units),
      actions: [command.type]
    });
  }

  private handleDeploy(playerId: string, command: any): void {
    const costs = this.getCommandCosts(command);
    if (!resourceManager.deductResources(playerId, costs)) return;

    const unitId = `${command.unitType}-${Date.now()}`;
    const unit = {
      id: unitId,
      type: command.unitType,
      position: command.position,
      ownerId: playerId,
      health: 100,
      visionRange: 10 // Adjust based on unit type
    };

    this.games.get(playerId)!.units.set(unitId, unit);
    visibilityManager.updateUnit(unit);
  }

  private handleMove(playerId: string, command: any): void {
    const unit = this.games.get(playerId)?.units.get(command.unitId);
    if (!unit) return;

    // Update unit position
    unit.position = command.position;
    visibilityManager.updateUnit(unit);
  }

  private handleAttack(playerId: string, command: any): void {
    const unit = this.games.get(playerId)?.units.get(command.unitId);
    if (!unit) return;

    // Validate target visibility
    if (!visibilityManager.validateVisibilityClaim(playerId, command.targetId)) {
      return;
    }

    // Process attack
    // Add combat logic here
  }

  update(): void {
    const now = Date.now();

    for (const [playerId, gameState] of this.games) {
      if (now - gameState.lastUpdate >= GameStateManager.UPDATE_INTERVAL) {
        // Update resources
        gameState.resources = resourceManager.getResources(playerId);
        
        // Update tech progress
        resourceManager.updateResearch(playerId);
        gameState.techProgress = resourceManager.getTechProgress(playerId);

        // Send state update to client
        const visibleUnits = visibilityManager.getVisibleUnits(playerId);
        const update = {
          type: 'state_update',
          payload: {
            resources: gameState.resources,
            units: visibleUnits,
            techProgress: Array.from(gameState.techProgress)
          }
        };

        // Broadcast update through WebSocket
        wsManager.broadcastToRoom(playerId, update);
        
        gameState.lastUpdate = now;
      }
    }
  }
}

export const gameStateManager = new GameStateManager(); 