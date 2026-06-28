// In dev, Vite proxy handles /api → localhost:8000
// In production, VITE_API_URL points to the Render backend
export const API_BASE = import.meta.env.VITE_API_URL || "";

// WebSocket URL derived from the API base
// "https://my-backend.onrender.com" → "wss://my-backend.onrender.com"
// "" (dev/proxy) → "ws://localhost:8000"
export const WS_BASE = API_BASE
  ? API_BASE.replace(/^http/, "ws")
  : "ws://localhost:8000";
