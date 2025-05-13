# NEURALFRONT Project Documentation

## 6. Backend & API

*   **Command Interpretation (`src/app/api/interpret-command/route.ts`):**
    *   Receives natural language commands via POST request.
    *   Uses OpenAI's GPT-3.5 (`gpt-3.5-turbo` via `@ai-sdk/openai`) to parse the command into a structured JSON format.
    *   Includes security checks (rate limiting, suspicious pattern detection).
    *   Validates the interpreted command against game rules (`validateGameRules`).
    *   Sanitizes the output command (`sanitizeCommand`).
    *   Runs on the Edge runtime.
*   **Real-time Communication (`src/pages/api/socket.ts`):**
    *   Initializes a Socket.IO server attached to the Next.js HTTP server.
    *   Manages client connections using `wsManager`.
    *   Listens for `command` events from clients.
    *   Validates incoming commands using `wsManager`.
    *   Processes valid commands using `gameStateManager.processCommand`.
    *   Handles disconnections.
    *   Broadcasts `state_update` events (handled by `gameStateManager`, presumably). 