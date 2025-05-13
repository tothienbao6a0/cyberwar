// Enums for AI Agent types and statuses
export enum UnitType {
  SCOUT = 'scout',
  DEFENDER = 'defender',
  ATTACKER = 'attacker',
  ENGINEER = 'engineer',
  DRONE = 'drone',
  TANK = 'tank',
  SPECIAL_OPS = 'special_ops',
  MEDIC = 'medic'
  // Add more as needed, aligning with your LLM prompt and game design
}

export enum UnitActionStatus {
  IDLE = 'idle',
  MOVING = 'moving',
  ATTACKING = 'attacking',
  DEFENDING = 'defending',
  BUILDING = 'building',
  REPAIRING = 'repairing',
  SCANNING = 'scanning',
  HACKING = 'hacking',
  POWERING_UP = 'powering_up',
  DEPLOYING = 'deploying',
  RETREATING = 'retreating',
  DESTROYED = 'destroyed'
  // Add more as needed
}

// You can add other relevant enums here, e.g., for directions, target types, etc.
// export enum Direction {
//   NORTH = 'north',
//   SOUTH = 'south',
//   ...
// } 