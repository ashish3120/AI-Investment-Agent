import WebSocket, { WebSocketServer } from "ws";
import redis from "./redisClient.js";

const GEMINI_API_KEY = process.env["gemini-3.1-flash-live-preview_api"];
const MODEL = "gemini-3.1-flash-live-preview";
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

console.log(`[GeminiLive] API Key loaded: ${GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 8) + '...' : 'MISSING!'}`);

/**
 * Attach Gemini Live WebSocket handling to an HTTP server.
 * Client connects to ws://host:port/ws/live?sessionId=xxx
 *
 * Protocol (client → server):
 *   { type: "text",  content: "hello" }
 *   { type: "audio", data: "<base64 PCM 16-bit 16kHz>" }
 *   { type: "audio_end" }
 *
 * Protocol (server → client):
 *   { type: "text",       content: "partial text" }
 *   { type: "audio",      data: "<base64 PCM 16-bit 24kHz>" }
 *   { type: "turn_complete" }
 *   { type: "error",      message: "..." }
 *   { type: "connected" }
 */
export function attachGeminiLive(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/live" });

  wss.on("connection", async (clientWs, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");

    console.log(`[GeminiLive] Client connected, sessionId=${sessionId}`);

    // Load research context from Redis
    let systemInstruction = `You are a helpful, context-aware financial research assistant. 
You help users understand their stock research results. 
Keep answers concise and professional. 
If the user speaks to you, respond with both text and voice.`;

    if (sessionId) {
      try {
        const contextData = await redis.get(`research:${sessionId}`);
        if (contextData) {
          const ctx = JSON.parse(contextData);
          systemInstruction += `\n\nResearch Context:\nCompany: ${ctx.company} (${ctx.ticker})\nMarket Cap: ${ctx.marketCap ? "$" + ctx.marketCap : "N/A"}\nComposite Score: ${ctx.score}\nMetrics: ${JSON.stringify(ctx.metrics, null, 2)}\nRaw Data: ${JSON.stringify(ctx.rawData, null, 2)}\nRisks: ${JSON.stringify(ctx.risks)}\nSummary: ${ctx.summary}`;
        }
      } catch (err) {
        console.error("[GeminiLive] Failed to load research context:", err.message);
      }
    }

    // Open WebSocket to Gemini
    let geminiWs = null;
    let setupComplete = false;

    try {
      geminiWs = new WebSocket(GEMINI_WS_URL);
    } catch (err) {
      clientWs.send(JSON.stringify({ type: "error", message: "Failed to connect to Gemini Live API" }));
      clientWs.close();
      return;
    }

    geminiWs.on("open", () => {
      console.log("[GeminiLive] Connected to Gemini, sending setup...");

      // Send setup message
      const setup = {
        setup: {
          model: `models/${MODEL}`,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Gacrux" }
              }
            }
          },
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          }
        }
      };
      console.log("[GeminiLive] Setup payload model:", setup.setup.model);
      geminiWs.send(JSON.stringify(setup));
    });

    geminiWs.on("message", (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        // Setup complete acknowledgement
        if (msg.setupComplete) {
          setupComplete = true;
          clientWs.send(JSON.stringify({ type: "connected" }));
          console.log("[GeminiLive] Setup complete");
          return;
        }

        // Handle server content (model responses)
        const serverContent = msg.serverContent;
        if (serverContent) {
          // Model turn parts (text + audio)
          if (serverContent.modelTurn?.parts) {
            for (const part of serverContent.modelTurn.parts) {
              if (part.text) {
                clientWs.send(JSON.stringify({ type: "text", content: part.text }));
              }
              if (part.inlineData) {
                clientWs.send(JSON.stringify({
                  type: "audio",
                  data: part.inlineData.data,
                  mimeType: part.inlineData.mimeType
                }));
              }
            }
          }

          // Turn complete
          if (serverContent.turnComplete) {
            clientWs.send(JSON.stringify({ type: "turn_complete" }));
          }
        }
      } catch (err) {
        console.error("[GeminiLive] Failed to parse Gemini message:", err.message);
      }
    });

    geminiWs.on("error", (err) => {
      console.error("[GeminiLive] Gemini WS error:", err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: "Gemini connection error: " + err.message }));
      }
    });

    geminiWs.on("close", (code, reason) => {
      const reasonStr = reason ? reason.toString() : "no reason";
      console.log(`[GeminiLive] Gemini WS closed: code=${code}, reason=${reasonStr}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: `Gemini session ended (code: ${code}, reason: ${reasonStr})` }));
        clientWs.close();
      }
    });

    // Handle messages from the frontend client
    clientWs.on("message", (rawData) => {
      if (!setupComplete) {
        console.warn("[GeminiLive] Ignoring client message - setup not complete");
        return;
      }

      try {
        const msg = JSON.parse(rawData.toString());

        if (msg.type === "text") {
          // Send text to Gemini
          geminiWs.send(JSON.stringify({
            clientContent: {
              turns: [{ role: "user", parts: [{ text: msg.content }] }],
              turnComplete: true
            }
          }));
        } else if (msg.type === "audio") {
          // Forward audio chunk to Gemini (new format)
          geminiWs.send(JSON.stringify({
            realtimeInput: {
              audio: {
                data: msg.data,
                mimeType: "audio/pcm;rate=16000"
              }
            }
          }));
        } else if (msg.type === "audio_end") {
          // Signal end of audio input
          geminiWs.send(JSON.stringify({
            clientContent: {
              turnComplete: true
            }
          }));
        }
      } catch (err) {
        console.error("[GeminiLive] Failed to parse client message:", err.message);
      }
    });

    clientWs.on("close", () => {
      console.log("[GeminiLive] Client disconnected");
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.close();
      }
    });

    clientWs.on("error", (err) => {
      console.error("[GeminiLive] Client WS error:", err.message);
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.close();
      }
    });
  });

  console.log("[GeminiLive] WebSocket server attached on /ws/live");
}
