import { GameState, ParsedCommand } from './gameState';
import { UnitType, UnitActionStatus } from './enums'; // Assuming UnitType is an enum

export function processCommand(command: ParsedCommand, gameState: GameState): void {
  gameState.log(`Processing command: ${JSON.stringify(command)}`);

  switch (command.action?.toLowerCase()) {
    case 'deploy':
      if (command.unitType && command.coordinates) {
        // Convert unit type to enum, handling both cases
        const unitTypeStr = command.unitType.toLowerCase();
        let unitType: UnitType;
        
        // Try to match the unit type string to our enum
        switch (unitTypeStr) {
          case 'scout':
            unitType = UnitType.SCOUT;
            break;
          case 'defender':
            unitType = UnitType.DEFENDER;
            break;
          case 'attacker':
            unitType = UnitType.ATTACKER;
            break;
          case 'engineer':
            unitType = UnitType.ENGINEER;
            break;
          case 'drone':
            unitType = UnitType.DRONE;
            break;
          case 'tank':
            unitType = UnitType.TANK;
            break;
          case 'special_ops':
          case 'specialops':
            unitType = UnitType.SPECIAL_OPS;
            break;
          case 'medic':
            unitType = UnitType.MEDIC;
            break;
          default:
            gameState.log(`Error: Invalid unitType '${command.unitType}' for deploy command.`);
            return;
        }

        const count = typeof command.count === 'number' ? command.count : 1;
        gameState.addAgent(unitType, command.coordinates, count);
      } else {
        gameState.log("Error: Deploy command missing unitType or coordinates.");
      }
      break;

    case 'move':
      if (command.unitId && command.coordinates) {
        gameState.moveAgent(command.unitId, command.coordinates);
      } else if (command.unitType && command.coordinates && command.count === 1) {
        // Simple case: move the first available unit of a type if ID is not specified
        const agentsOfType = gameState.getAgents().filter(agent => agent.type === command.unitType && agent.status !== UnitActionStatus.MOVING);
        if (agentsOfType.length > 0) {
          gameState.moveAgent(agentsOfType[0].id, command.coordinates);
        } else {
          gameState.log(`Error: No idle ${command.unitType} found to move.`);
        }
      } else {
        gameState.log("Error: Move command missing unitId/unitType or coordinates.");
      }
      break;

    // --- Basic Attack Command --- 
    case 'attack':
      if (command.unitId && command.target) { // Assuming target is an ID for now
        const attacker = gameState.agents.get(command.unitId);
        const targetAgent = gameState.agents.get(command.target);

        if (attacker && targetAgent) {
          attacker.status = UnitActionStatus.ATTACKING;
          attacker.targetId = command.target;
          attacker.lastUpdated = Date.now();
          gameState.log(`Agent ${attacker.id} (${attacker.type}) is now ATTACKING target ${targetAgent.id} (${targetAgent.type}).`);
          // In a real game, you'd simulate damage, check range, etc.
          // For now, just log the state change.
          // Potentially, reduce target health: 
          // targetAgent.health -= 10; // Example damage
          // if (targetAgent.health <= 0) { 
          //   targetAgent.status = UnitActionStatus.DESTROYED; 
          //   gameState.log(`Agent ${targetAgent.id} has been DESTROYED!`); 
          // }
        } else {
          gameState.log(`Error: Attacker ${command.unitId} or Target ${command.target} not found for attack command.`);
        }
      } else {
        gameState.log("Error: Attack command missing unitId or targetId.");
      }
      break;

    // Add more cases for other actions: scout, defend, etc.
    // Example: scout
    case 'scout':
      if (command.direction && command.unitType) {
        const type = command.unitType.toUpperCase() as keyof typeof UnitType;
        if (UnitType[type]) {
          const count = typeof command.count === 'number' ? command.count : 1;
          let deployedScouts = 0;
          // Try to deploy new scouts if none are available
          if (gameState.getAgents().filter(a => a.type === UnitType[type]).length < count) {
            const newScouts = gameState.addAgent(UnitType[type], command.coordinates || {x:0,y:0}, count);
             deployedScouts = newScouts.length;
          }
          // Then try to assign existing idle scouts
          const availableScouts = gameState.getAgents().filter(a => a.type === UnitType[type] && a.status === UnitActionStatus.IDLE);
          const scoutsToAssign = Math.min(availableScouts.length, count - deployedScouts);
          
          for(let i=0; i < scoutsToAssign; i++) {
            availableScouts[i].status = UnitActionStatus.MOVING; // Or a specific SCOUTING status
            availableScouts[i].destination = { x: (availableScouts[i].position.x + (command.direction === 'right' ? 50 : command.direction === 'left' ? -50 : 0)), y: (availableScouts[i].position.y + (command.direction === 'down' ? 50 : command.direction === 'up' ? -50 : 0))}; // Example movement
            gameState.log(`Agent ${availableScouts[i].id} (${UnitType[type]}) is now SCOUTING towards ${command.direction}. Destination: ${JSON.stringify(availableScouts[i].destination)}`);
          }
          if(count > (deployedScouts + scoutsToAssign)) {
            gameState.log(`Could not fulfill entire scout request. Requested: ${count}, Actioned: ${deployedScouts + scoutsToAssign}`);
          }

        } else {
          gameState.log(`Error: Invalid unitType '${command.unitType}' for scout command.`);
        }
      } else {
        gameState.log("Error: Scout command missing direction or unitType.");
      }
      break;

    default:
      gameState.log(`Warning: Unknown action '${command.action}' received.`);
  }
  // After processing, the gameState object will be mutated.
} 