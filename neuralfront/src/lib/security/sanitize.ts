import { ParsedCommand } from '../ai/gameState';

// Sanitize and validate game commands
export function sanitizeCommand(command: ParsedCommand): ParsedCommand {
  return {
    ...command,
    // Ensure strings are trimmed and don't contain special characters
    action: command.action.toLowerCase().trim(),
    unitType: command.unitType?.toLowerCase().trim(),
    unitId: command.unitId?.replace(/[^a-zA-Z0-9-]/g, ''),
    // Ensure numbers are within reasonable bounds
    count: typeof command.count === 'number' 
      ? Math.min(Math.max(1, Math.floor(command.count)), 10) 
      : command.count,
    // Normalize directions
    direction: command.direction?.toLowerCase().trim(),
    target: command.target?.replace(/[^a-zA-Z0-9-_]/g, ''),
    // Ensure coordinates are within bounds
    coordinates: command.coordinates ? {
      x: Math.min(Math.max(0, Math.floor(command.coordinates.x)), 100),
      y: Math.min(Math.max(0, Math.floor(command.coordinates.y)), 100)
    } : undefined,
    // Normalize enums
    priority: command.priority?.toLowerCase().trim(),
    formation: command.formation?.toLowerCase().trim(),
    specialAbility: command.specialAbility?.toLowerCase().trim()
  };
}

// Additional security checks for command strings
export function isCommandSafe(input: string): boolean {
  // Check for potential SQL injection
  const sqlPatterns = [
    /union\s+select/i,
    /insert\s+into/i,
    /drop\s+table/i,
    /--/,
    /;/,
    /'.*'/
  ];

  // Check for potential command injection
  const commandPatterns = [
    /\|\s*[\w\s]/i,  // pipe to command
    />\s*[\w\s]/i,   // redirect output
    /\$\([^)]*\)/,   // command substitution
    /`[^`]*`/,       // backtick execution
  ];

  // Check for potential path traversal
  const pathPatterns = [
    /\.\.\//,
    /\.\./,
    /~\//
  ];

  return ![...sqlPatterns, ...commandPatterns, ...pathPatterns].some(
    pattern => pattern.test(input)
  );
} 