import { visibilityManager } from '../game/visibility';
import { resourceManager } from '../game/resources';
import { WebSocketMessage } from './websocket';

interface StateSnapshot {
  timestamp: number;
  resources: Record<string, any>;
  units: Record<string, any>;
  actions: string[];
}

export class AntiCheatSystem {
  private stateHistory: Map<string, StateSnapshot[]> = new Map();
  private suspiciousActivity: Map<string, number> = new Map();
  private static readonly HISTORY_LENGTH = 100;
  private static readonly SUSPICIOUS_THRESHOLD = 5;

  // Patterns that might indicate cheating
  private static readonly SUSPICIOUS_PATTERNS = {
    rapidCommands: { timeWindow: 1000, maxCount: 10 },
    resourceSpikes: { threshold: 1000 },
    teleportation: { maxDistance: 50 },
    wallHacks: { enabled: true },
    speedHacks: { maxSpeed: 10 }
  };

  addStateSnapshot(playerId: string, state: StateSnapshot): void {
    if (!this.stateHistory.has(playerId)) {
      this.stateHistory.set(playerId, []);
    }

    const history = this.stateHistory.get(playerId)!;
    history.push(state);

    // Keep history size limited
    if (history.length > AntiCheatSystem.HISTORY_LENGTH) {
      history.shift();
    }
  }

  validateAction(playerId: string, action: WebSocketMessage): boolean {
    const history = this.stateHistory.get(playerId) || [];
    if (history.length === 0) return true;

    let suspicious = false;
    const lastState = history[history.length - 1];

    // Check for rapid commands
    const recentActions = history
      .filter(s => s.timestamp > Date.now() - AntiCheatSystem.SUSPICIOUS_PATTERNS.rapidCommands.timeWindow)
      .flatMap(s => s.actions);

    if (recentActions.length > AntiCheatSystem.SUSPICIOUS_PATTERNS.rapidCommands.maxCount) {
      suspicious = true;
    }

    // Check for resource cheating
    if (action.type === 'resource') {
      const currentResources = resourceManager.getResources(playerId);
      const previousResources = lastState.resources;

      Object.entries(currentResources).forEach(([resource, amount]) => {
        const diff = amount - (previousResources[resource] || 0);
        if (diff > AntiCheatSystem.SUSPICIOUS_PATTERNS.resourceSpikes.threshold) {
          suspicious = true;
        }
      });
    }

    // Check for visibility cheating
    if (action.type === 'command' && action.payload.targetId) {
      if (!visibilityManager.validateVisibilityClaim(playerId, action.payload.targetId)) {
        suspicious = true;
      }
    }

    // Check for movement cheating
    if (action.type === 'command' && action.payload.position) {
      const unit = lastState.units[action.payload.unitId];
      if (unit) {
        const distance = this.calculateDistance(
          unit.position,
          action.payload.position
        );
        if (distance > AntiCheatSystem.SUSPICIOUS_PATTERNS.teleportation.maxDistance) {
          suspicious = true;
        }
      }
    }

    if (suspicious) {
      this.recordSuspiciousActivity(playerId);
    }

    return !this.isBanned(playerId);
  }

  private calculateDistance(pos1: any, pos2: any): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private recordSuspiciousActivity(playerId: string): void {
    const count = (this.suspiciousActivity.get(playerId) || 0) + 1;
    this.suspiciousActivity.set(playerId, count);

    if (count >= AntiCheatSystem.SUSPICIOUS_THRESHOLD) {
      this.banPlayer(playerId);
    }
  }

  private banPlayer(playerId: string): void {
    // Implement ban logic (e.g., add to banned list, notify admins, etc.)
    console.warn(`Player ${playerId} banned for suspicious activity`);
  }

  isBanned(playerId: string): boolean {
    return (this.suspiciousActivity.get(playerId) || 0) >= AntiCheatSystem.SUSPICIOUS_THRESHOLD;
  }

  // Verify server-side state matches client-side state
  validateStateSync(playerId: string, clientState: any): boolean {
    const serverState = this.stateHistory.get(playerId)?.slice(-1)[0];
    if (!serverState) return true;

    // Compare critical state elements
    const stateMatch = this.compareStates(serverState, clientState);
    if (!stateMatch) {
      this.recordSuspiciousActivity(playerId);
      return false;
    }

    return true;
  }

  private compareStates(server: any, client: any): boolean {
    // Compare critical game state elements
    // This is a simplified version - expand based on your game's needs
    return (
      this.compareResources(server.resources, client.resources) &&
      this.compareUnits(server.units, client.units)
    );
  }

  private compareResources(server: any, client: any): boolean {
    return Object.entries(server).every(
      ([resource, amount]) => Math.abs(amount - (client[resource] || 0)) < 0.01
    );
  }

  private compareUnits(server: any, client: any): boolean {
    return Object.entries(server).every(([id, unit]: [string, any]) => {
      const clientUnit = client[id];
      if (!clientUnit) return false;
      return (
        unit.position.x === clientUnit.position.x &&
        unit.position.y === clientUnit.position.y &&
        unit.health === clientUnit.health
      );
    });
  }
}

export const antiCheatSystem = new AntiCheatSystem(); 