# How it works — Approach and Architecture

The application is built using a modern **React (Vite)** frontend and a **Node.js (Express)** backend.

### 1. Intelligent Ticker Resolution
When a user searches for a company, the backend utilizes a 3-layer resolution system:
1. **Local Map:** Fast lookups for common companies (e.g. "google" -> GOOGL).
2. **Finnhub Search:** API-based symbol matching.
3. **LLM Fallback (Groq):** Resolves natural language (e.g. "the iphone maker" -> AAPL).
It also filters out non-US and private markets immediately, saving API calls.

### 2. Guided ReAct Reasoning Engine
Instead of just asking an LLM to generate a report, the backend employs a **Guided ReAct (Reasoning + Acting) Agent**:
- The agent is assigned a "Research Plan" based on the company's sector.
- It enters a loop: **Thought → Action → Observation**.
- For example, it decides it needs revenue data, executes the `edgar_financials` tool, reads the XBRL observation, and then decides its next move.
- The entire reasoning trace is streamed in real-time to the frontend via Server-Sent Events (SSE).

### 3. Sector-Aware Composite Scoring
Once the agent finishes fetching data, a deterministic scoring engine evaluates the metrics:
- Tech companies weigh revenue growth and gross margins heavily.
- REITs weigh FFO (Funds from Operations) and occupancy rates.
- Banks weigh Net Interest Margins (NIM).
Each metric is normalized to a 0-100 scale and combined into a final letter grade (A+ through D).

### 4. Multilingual Voice Assistant (Gemini Live)
A primary feature of the architecture is the real-time WebSocket proxy to Gemini Live:
- The backend establishes a persistent WebSocket connection to Google's Multimodal API.
- The completed research report (metrics, scores, risks) is injected as context.
- The browser captures the user's microphone using `AudioWorklet`, streaming 16kHz PCM audio to the backend, which forwards it to Gemini.
- The AI responds in whatever language the user speaks, fully aware of the financial research on screen.

### 5. Caching and Performance
- **Redis** is heavily utilized to cache research sessions, preventing duplicate EDGAR/Finnhub queries if a user searches the same ticker.
- Gemini's TTS (Text-to-Speech) audio files are also cached in Redis as base64 for instant playback.
