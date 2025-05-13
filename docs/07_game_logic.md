# NEURALFRONT Project Documentation

## 8. Game Logic

*   **Agents (`src/lib/ai/agent.ts` - inferred):** Represents units on the battlefield with properties like `id`, `type`, `position`, `destination`.
*   **Commands:** Users input natural language commands, which are interpreted into actions (`move`, `attack`, `deploy`, etc.) with parameters (unit type, count, coordinates, etc.).
*   **Game Loop:** Runs on the server (`setInterval` in `socket.ts`), likely updating agent positions, resolving combat, managing resources, etc., via `gameStateManager.update()`.
*   **Rules:** `src/lib/security/gameRules.ts` validates interpreted commands against the current game state. 