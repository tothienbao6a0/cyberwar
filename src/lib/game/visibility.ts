interface Position {
  x: number;
  y: number;
}

interface Unit {
  id: string;
  position: Position;
  visionRange: number;
  ownerId: string;
  stealthed?: boolean;
}

export class VisibilityManager {
  private units: Map<string, Unit> = new Map();
  private visibilityGrid: Map<string, Set<string>> = new Map(); // cellKey -> playerIds that can see it
  private static readonly GRID_SIZE = 10; // Size of each grid cell

  private getCellKey(pos: Position): string {
    const gridX = Math.floor(pos.x / VisibilityManager.GRID_SIZE);
    const gridY = Math.floor(pos.y / VisibilityManager.GRID_SIZE);
    return `${gridX},${gridY}`;
  }

  private getAffectedCells(pos: Position, range: number): string[] {
    const cells: string[] = [];
    const radius = Math.ceil(range / VisibilityManager.GRID_SIZE);
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const cellX = Math.floor(pos.x / VisibilityManager.GRID_SIZE) + dx;
        const cellY = Math.floor(pos.y / VisibilityManager.GRID_SIZE) + dy;
        cells.push(`${cellX},${cellY}`);
      }
    }
    
    return cells;
  }

  private distance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  updateUnit(unit: Unit): void {
    const oldUnit = this.units.get(unit.id);
    if (oldUnit) {
      // Remove visibility from old position
      const oldCells = this.getAffectedCells(oldUnit.position, oldUnit.visionRange);
      oldCells.forEach(cell => {
        const viewers = this.visibilityGrid.get(cell);
        if (viewers) {
          viewers.delete(oldUnit.ownerId);
          if (viewers.size === 0) {
            this.visibilityGrid.delete(cell);
          }
        }
      });
    }

    // Add visibility to new position
    const newCells = this.getAffectedCells(unit.position, unit.visionRange);
    newCells.forEach(cell => {
      if (!this.visibilityGrid.has(cell)) {
        this.visibilityGrid.set(cell, new Set());
      }
      this.visibilityGrid.get(cell)!.add(unit.ownerId);
    });

    this.units.set(unit.id, unit);
  }

  removeUnit(unitId: string): void {
    const unit = this.units.get(unitId);
    if (!unit) return;

    const cells = this.getAffectedCells(unit.position, unit.visionRange);
    cells.forEach(cell => {
      const viewers = this.visibilityGrid.get(cell);
      if (viewers) {
        viewers.delete(unit.ownerId);
        if (viewers.size === 0) {
          this.visibilityGrid.delete(cell);
        }
      }
    });

    this.units.delete(unitId);
  }

  isVisible(pos: Position, playerId: string): boolean {
    const cell = this.getCellKey(pos);
    const viewers = this.visibilityGrid.get(cell);
    return viewers?.has(playerId) || false;
  }

  getVisibleUnits(playerId: string): Unit[] {
    return Array.from(this.units.values()).filter(unit => {
      if (unit.ownerId === playerId) return true;
      if (unit.stealthed) return false;
      return this.isVisible(unit.position, playerId);
    });
  }

  // For anti-cheat: verify client-side visibility claims
  validateVisibilityClaim(playerId: string, targetId: string): boolean {
    const target = this.units.get(targetId);
    if (!target) return false;
    return this.isVisible(target.position, playerId);
  }
}

export const visibilityManager = new VisibilityManager(); 