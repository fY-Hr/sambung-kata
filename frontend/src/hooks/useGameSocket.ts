import { useEffect, useRef, useState } from "react";

export interface Player {
  id: string;
  name: string;
  hp: number;
  afk: boolean;
  dead: boolean;
}

export interface GameConfig {
  maxHp: 1 | 2 | 3;
  timePerTurn: number;
}

export interface GameState {
  gameStatus: boolean;
  currentWord: string;
  lastChar: string;
  players: Player[];
  turnIndex: number;
  activePlayer: Player | null;
  winner: Player | null;
  gameConfig: GameConfig;
  usedWordsCount: number;
  turnDeadline?: number;
}

export function useTurnCountdown(turnDeadline?: number, totalSeconds: number = 10) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!turnDeadline || turnDeadline <= 0) {
      setTimeLeft(0);
      return;
    }

    const calc = () => {
      const ms = turnDeadline - Date.now();
      const seconds = Math.max(0, Math.ceil(ms / 1000));
      setTimeLeft(seconds);
    };

    calc();
    const interval = setInterval(calc, 100);
    return () => clearInterval(interval);
  }, [turnDeadline]);

  const percentage =
    totalSeconds > 0 && turnDeadline
      ? Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100))
      : 0;

  return { timeLeft, percentage };
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-https HTTP LAN connections on mobile
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("sk_player_id");
    if (!id) {
      id = generateUUID();
      localStorage.setItem("sk_player_id", id);
    }
    setPlayerId(id);

    const host = window.location.hostname || "localhost";
    const ws = new WebSocket(`ws://${host}:4000/ws?playerId=${id}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "SYNC_STATE") {
          setGameState(msg.data);
        } else if (msg.type === "ERROR") {
          setErrorMessage(msg.message);
          setTimeout(() => setErrorMessage(null), 3500);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const send = (type: string, payload = {}) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...payload }));
    }
  };

  return {
    gameState,
    playerId,
    errorMessage,
    joinGame: (name: string) => send("JOIN_GAME", { name }),
    startGame: (config?: GameConfig) => send("START_GAME", { config }),
    endGame: () => send("END_GAME"),
    submitAnswer: (answer: string) => send("SUBMIT_ANSWER", { answer }),
    toggleAfk: () => send("TOGGLE_AFK"),
  };
}