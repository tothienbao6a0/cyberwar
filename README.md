# NEURALFRONT

A futuristic real-time strategy game where players command AI agents on a cyberwar battlefield.

## 🚀 Overview

NEURALFRONT is a 1v1 AI-vs-AI battle game. Players input natural-language commands, which are then processed by an LLM and dispatched to AI agents. The game features a live-updating 2D battlefield.

## 🛠 Tech Stack

**Frontend:**
- Next.js + React
- Tailwind CSS
- shadcn/ui
- react-konva
- Framer Motion

**Backend:**
- Supabase (PostgreSQL DB + Auth + Realtime)
- WebSocket support (Supabase Realtime or Socket.io)
- Vercel (Deployment + Edge Functions)

**AI Layer:**
- Vercel AI SDK (OpenRouter or OpenAI API)

## 🎮 Game Logic

- Players join matches via Supabase.
- Commands are issued via a text bar (e.g., "Send two scouts to flank right").
- LLM parses commands into structured JSON (e.g., `{ action: "flank", unitType: "scout", direction: "right", count: 2 }`).
- AI units execute commands and adapt to the battlefield.

## 🎨 UI Style

- Theme: Minimalist 2030-era cyberwarfare UI.
- Fonts: Orbitron, Rajdhani, Chakra Petch, Oxanium.
- Color Palette:
    - Background: `#0B0F14`
    - Accent Cyan: `#00FFD1`
    - Alert Red: `#FF4F58`
    - AI Green: `#96FF00`
    - Borders & Lines: `#202932`

## ⚙️ Setup

```bash
# Clone the repository
git clone <repository-url>
cd neuralfront

# Install dependencies
npm install

# Run the development server
npm run dev
```

## 📝 TODO

- [ ] Scaffold Next.js + Tailwind app
- [x] Initialize shadcn/ui
- [x] Create directory structure
- [x] Create README.md
- [ ] Create home page with dark background, command input, and placeholder canvas
- [ ] Set up Supabase project (Realtime, Auth, DB schema)
- [ ] Install and connect Vercel AI SDK
- [ ] Build minimal agent logic engine
- [ ] Add debug logs/terminal 