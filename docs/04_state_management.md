# NEURALFRONT Project Documentation

## 5. State Management

*   **Client-Side:** `useGameSocket` hook (`src/app/game/useGameSocket.ts`) manages the WebSocket connection and holds the latest `gameState` received from the server.
*   **Server-Side:** `gameStateManager` (`src/lib/game/gameStateManager.ts`) appears to manage the authoritative game state on the server, processing commands and broadcasting updates via Socket.IO. It runs a game loop (`setInterval` in `src/pages/api/socket.ts`). 