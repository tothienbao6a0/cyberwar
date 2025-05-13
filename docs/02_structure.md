# NEURALFRONT Project Documentation

## 3. Directory Structure

*   **`/` (Root):** Configuration files (`package.json`, `tailwind.config.ts`, `next.config.js`, `tsconfig.json`, etc.), README, LICENSE.
*   **`src/`:** Main application source code.
    *   **`app/`:** Next.js App Router.
        *   **`layout.tsx`:** Root layout, applies global styles, fonts, dark mode.
        *   **`page.tsx`:** Root page (currently displays game state).
        *   **`globals.css`:** Global CSS definitions, Tailwind base/components/utilities, custom CSS variables for theme.
        *   **`game/`:** Contains the main game page (`page.tsx`) and its associated client-side hook (`useGameSocket.ts`).
        *   **`api/`:** Next.js API routes (server-side).
            *   **`interpret-command/route.ts`:** Handles natural language command interpretation using OpenAI.
    *   **`components/`:** Reusable React components.
        *   **`Battlefield.tsx`:** The core game visualization component using `react-konva` to render the grid, units, etc. Includes logic for panning, zooming, and fitting the grid.
        *   **`ui/`:** Likely contains UI primitives generated or used by `shadcn/ui` (based on `components.json`).
    *   **`lib/`:** Core logic, utilities, and modules.
        *   **`ai/`:** AI-related logic, potentially agent behavior (`agent.ts` mentioned in `Battlefield.tsx` imports but not listed in directory structure).
        *   **`game/`:** Core game logic (state management - `gameStateManager.ts`, resources, visibility - potentially).
        *   **`security/`:** Security features (rate limiting - `rateLimit.ts`, input sanitization - `sanitize.ts`, game rule validation - `gameRules.ts`, WebSocket management - `websocket.ts`).
        *   **`supabaseClient.ts`:** Initializes the Supabase client using environment variables.
        *   **`utils.ts`:** General utility functions (e.g., `cn` for merging Tailwind classes).
    *   **`pages/`:** Next.js Pages Router (used for API routes like Socket.IO).
        *   **`api/socket.ts`:** Sets up the Socket.IO server, handles connections, disconnections, and forwards commands to the `gameStateManager`.
    *   **`hooks/`:** Custom React hooks (directory exists but content not shown).
    *   **`db/`:** Database-related logic (directory exists but content not shown, likely interacts with `supabaseClient`).
    *   **`canvas/`:** Canvas-specific logic (directory exists but content not shown, potentially unused or refactored into `Battlefield.tsx`).
*   **`public/`:** Static assets (e.g., `favicon.ico`). 