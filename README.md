# Sambung Kata 🎮

A real-time multiplayer Indonesian word chain ("Sambung Kata") game built with **Bun**, **WebSockets**, and **React 19**. Players take turns submitting valid Indonesian words (validated against a KBBI dictionary) starting with the last letter of the previous word before the turn timer expires.

---

## 📋 Table of Contents
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Testing Multiplayer Locally](#-testing-multiplayer-locally)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [How It Works](#-how-it-works)
  - [WebSocket Events](#websocket-events)
  - [Game Rules](#game-rules)

---

## 🛠 Tech Stack

- **Backend**:
  - Runtime: [Bun](https://bun.sh) (`Bun.serve` with native WebSockets)
  - Language: TypeScript
  - Dictionary: KBBI (`kbbi.txt`) dataset with in-memory Set lookup
- **Frontend**:
  - Framework: [React 19](https://react.dev)
  - Bundler & Dev Server: [Vite](https://vite.dev)
  - Routing: [TanStack Router](https://tanstack.com/router)
  - Styling: [Tailwind CSS v4](https://tailwindcss.com)

---

## ⚙️ Prerequisites

Make sure you have **Bun** installed on your system (v1.1 or later recommended):

```bash
# Install Bun (Linux / macOS)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

---

## 🚀 Local Setup

The project is split into two directories: `backend` and `frontend`. You will need two terminal windows to run both servers simultaneously.

### 1. Backend Setup

The backend handles the game logic, turn management, timer, and WebSocket synchronization.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
bun install

# 3. Start the WebSocket server
bun run index.ts
```

> [!NOTE]
> The backend server runs at `http://0.0.0.0:4000` with the WebSocket endpoint at `ws://localhost:4000/ws`.

---

### 2. Frontend Setup

The frontend provides the user interface and connects to the backend over WebSocket.

Open a **new terminal tab or window**:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
bun install

# 3. Start the development server
bun run dev
```

> [!NOTE]
> The frontend dev server will be accessible at `http://localhost:3000`.

---

## 👥 Testing Multiplayer Locally

To test the multiplayer functionality on a single machine:

1. Open your browser and go to `http://localhost:3000`.
2. Enter a player name and join the lobby.
3. Open an **Incognito / Private Window** (or a different browser such as Firefox/Chrome) and visit `http://localhost:3000`.
4. Enter a different player name and join.
5. In the host window, configure the game settings (Max HP, Time per turn) and click **Start Game**.

> [!TIP]
> Each browser session maintains its own unique player ID in `localStorage` (`sk_player_id`), so separate incognito sessions or browsers represent separate players.

---

## 📂 Project Structure

```text
sambung-kata/
├── backend/
│   ├── index.ts          # Bun.serve HTTP & WebSocket handler
│   ├── game.ts           # Core game state & turn-based logic
│   ├── kbbi.txt          # KBBI dictionary dataset for validation
│   ├── package.json      # Backend scripts and Bun types
│   └── tsconfig.json     # Backend TypeScript configuration
├── frontend/
│   ├── src/
│   │   ├── hooks/        # useGameSocket.ts (WebSocket client hook)
│   │   ├── routes/       # TanStack file-based routes
│   │   ├── components/   # UI components
│   │   └── styles.css    # Tailwind CSS entrypoint
│   ├── index.html        # HTML entry point
│   ├── vite.config.ts    # Vite configuration
│   ├── package.json      # Frontend dependencies & scripts
│   └── tsconfig.json     # Frontend TypeScript configuration
└── README.md             # Project documentation
```

---

## 📜 Available Scripts

### Backend (`/backend`)
| Command | Description |
| --- | --- |
| `bun install` | Installs backend dependencies |
| `bun run index.ts` | Starts the WebSocket server on port `4000` |

### Frontend (`/frontend`)
| Command | Description |
| --- | --- |
| `bun install` | Installs frontend dependencies |
| `bun run dev` | Starts the Vite dev server at `http://localhost:3000` |
| `bun run build` | Builds frontend assets for production |
| `bun run preview` | Previews the production build locally |
| `bun run generate-routes` | Generates TanStack router route tree |

---

## 💡 How It Works

### WebSocket Events

Communication between client and server occurs over WebSockets:

- **Client to Server**:
  - `JOIN_GAME`: Join the room with a display name.
  - `START_GAME`: Start a round with config (`maxHp`, `timePerTurn`).
  - `SUBMIT_ANSWER`: Submit a word during the player's turn.
  - `TOGGLE_AFK`: Toggle AFK status for the player.
  - `END_GAME`: Forcefully stop/end the current game.

- **Server to Client**:
  - `SYNC_STATE`: Broadcasts latest room and game state to all players.
  - `ERROR`: Notifies client of invalid inputs (e.g., word not found in KBBI, wrong starting letter, word already used).

### Game Rules
1. Players start with a set amount of HP (configured before game start).
2. The active player must submit a valid Indonesian word starting with the letter indicated (`lastChar`).
3. Words must exist in `kbbi.txt` and cannot be reused within the same game.
4. If the timer runs out without a valid submission, the player loses 1 HP.
5. When a player's HP reaches 0, they are eliminated. The last remaining player wins!
