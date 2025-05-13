export interface Resources {
  credits: number;
  energy: number;
  intel: number;
  tech: number;
}

export interface TechNode {
  id: string;
  name: string;
  description: string;
  cost: Partial<Resources>;
  requirements: string[];
  unlocks: string[];
  researchTime: number;
}

export class ResourceManager {
  private resources: Map<string, Resources> = new Map();
  private techProgress: Map<string, Set<string>> = new Map();
  private researchQueue: Map<string, { tech: string; startTime: number }[]> = new Map();

  private static readonly INITIAL_RESOURCES: Resources = {
    credits: 1000,
    energy: 100,
    intel: 0,
    tech: 0
  };

  private static readonly TECH_TREE: Record<string, TechNode> = {
    'advanced_units': {
      id: 'advanced_units',
      name: 'Advanced Units',
      description: 'Unlock higher tier units',
      cost: { credits: 500, tech: 50 },
      requirements: [],
      unlocks: ['special_ops', 'tank'],
      researchTime: 60000 // 60 seconds
    },
    'energy_efficiency': {
      id: 'energy_efficiency',
      name: 'Energy Efficiency',
      description: 'Reduce energy costs by 25%',
      cost: { credits: 300, energy: 100 },
      requirements: [],
      unlocks: ['advanced_energy'],
      researchTime: 45000
    }
    // Add more tech nodes as needed
  };

  initializePlayer(playerId: string): void {
    this.resources.set(playerId, {...ResourceManager.INITIAL_RESOURCES});
    this.techProgress.set(playerId, new Set());
    this.researchQueue.set(playerId, []);
  }

  canAfford(playerId: string, costs: Partial<Resources>): boolean {
    const playerResources = this.resources.get(playerId);
    if (!playerResources) return false;

    return Object.entries(costs).every(([resource, cost]) => 
      playerResources[resource as keyof Resources] >= (cost || 0)
    );
  }

  deductResources(playerId: string, costs: Partial<Resources>): boolean {
    if (!this.canAfford(playerId, costs)) return false;

    const playerResources = this.resources.get(playerId)!;
    Object.entries(costs).forEach(([resource, cost]) => {
      playerResources[resource as keyof Resources] -= (cost || 0);
    });

    return true;
  }

  canResearch(playerId: string, techId: string): boolean {
    const tech = ResourceManager.TECH_TREE[techId];
    if (!tech) return false;

    const playerTech = this.techProgress.get(playerId);
    if (!playerTech) return false;

    // Check if already researched
    if (playerTech.has(techId)) return false;

    // Check requirements
    if (!tech.requirements.every(req => playerTech.has(req))) return false;

    // Check resources
    return this.canAfford(playerId, tech.cost);
  }

  startResearch(playerId: string, techId: string): boolean {
    if (!this.canResearch(playerId, techId)) return false;

    const tech = ResourceManager.TECH_TREE[techId];
    this.deductResources(playerId, tech.cost);

    const queue = this.researchQueue.get(playerId)!;
    queue.push({ tech: techId, startTime: Date.now() });

    return true;
  }

  updateResearch(playerId: string): void {
    const queue = this.researchQueue.get(playerId);
    if (!queue?.length) return;

    const now = Date.now();
    while (queue.length > 0) {
      const current = queue[0];
      const tech = ResourceManager.TECH_TREE[current.tech];
      
      if (now - current.startTime >= tech.researchTime) {
        // Research complete
        this.techProgress.get(playerId)!.add(current.tech);
        queue.shift();
      } else {
        break;
      }
    }
  }

  getTechProgress(playerId: string): Set<string> {
    return this.techProgress.get(playerId) || new Set();
  }

  getResources(playerId: string): Resources {
    return this.resources.get(playerId) || {...ResourceManager.INITIAL_RESOURCES};
  }
}

export const resourceManager = new ResourceManager(); 