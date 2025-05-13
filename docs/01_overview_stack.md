# NEURALFRONT Project Documentation

## 1. Project Overview

NEURALFRONT is a web-based AI vs AI cyberwarfare strategy game. Users interact with the game by issuing natural language commands, which are interpreted by an AI (OpenAI GPT-3.5) and translated into game actions. The game features a real-time battlefield visualization using HTML Canvas (Konva.js) and real-time communication via WebSockets (Socket.IO).

## 2. Technology Stack

*   **Framework:** Next.js (v15) with Turbopack
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v3) with custom theme, `tailwindcss-animate` plugin
*   **UI Components:** Radix UI (`@radix-ui/react-slot`), Lucide Icons (`lucide-react`)
*   **Frontend Rendering:** React (v19)
*   **Canvas:** Konva.js (`konva`, `react-konva`) for battlefield rendering
*   **Real-time Communication:** Socket.IO (`socket.io`, `socket.io-client`)
*   **AI:** OpenAI GPT-3.5 (`@ai-sdk/openai`, `ai` Vercel AI SDK) for command interpretation
*   **Database:** Supabase (`@supabase/supabase-js`) - Client is configured, but usage details (tables, queries) are not visible in the provided files.
*   **Utilities:** `clsx`, `tailwind-merge`, `zod` (validation), `framer-motion` (animations), `uuid` 