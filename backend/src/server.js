import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { GuidedReActAgent } from "./agent/reactAgent.js";
import { SectorAwareScorer } from "./scorer/scorer.js";
import { ShortTermMemory } from "./agent/memory.js";
import redis from "./redisClient.js";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { resolveTicker } from "./tools/tickerResolver.js";
import { attachGeminiLive } from "./geminiLive.js";

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // Set FRONTEND_URL on Render to your Vercel domain
  credentials: true
}));
app.use(express.json());

app.get("/api/research", async (req, res) => {
  const { ticker: rawTicker, query = "Full fundamental analysis" } = req.query;
  if (!rawTicker) return res.status(400).json({ error: "ticker is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const JUNE_2026_IPO_FALLBACKS = {
    "spacex": "SPCX",
    "space exploration technologies": "SPCX",
    "starlink": "SPCX",
    "innio": "INIO",
    "quantinuum": "QNT",
    "dpc holdings": "DPC",
    "doncasters": "DPC",
    "parabilis": "PBLS",
    "parabilis medicines": "PBLS",
    "erock": "EROC",
    "liftoff mobile": "LFTO",
    "kardigan": "KARD",
    "sinda": "SIND",
    "dsc holdings": "DSC",
    "deep fission": "FISN",
    "first carolina": "FCBM",
    "anthropic": "ANT"
  };

  const normalizedInput = rawTicker.trim().toLowerCase();
  const isIpoFallback = JUNE_2026_IPO_FALLBACKS[normalizedInput] || Object.values(JUNE_2026_IPO_FALLBACKS).map(v => v.toLowerCase()).includes(normalizedInput);

  if (isIpoFallback) {
    const emit = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    emit({ type: "error", message: `we do not have enough data about this ${rawTicker} as it listed this month` });
    res.end();
    return;
  }

  let resolvedTicker = await resolveTicker(rawTicker);

  if (resolvedTicker === "PRIVATE_MARKET") {
    const emit = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    emit({ type: "error", message: `This company is completely private. It does not trade on public stock exchanges in US` });
    res.end();
    return;
  }

  let companyName = rawTicker;
  let sector = "Technology"; // default

  try {
    // Use the resolved ticker for profile lookup (gets company name + sector)

    const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${resolvedTicker}&token=${process.env.FINNHUB_API_KEY}`);
    const profileData = await profileRes.json();
    if (profileData && profileData.name) {
      companyName = profileData.name;
    }
    if (profileData && profileData.finnhubIndustry) {
      sector = profileData.finnhubIndustry;
    }

    if (sector === "Real Estate" || sector === "Equity Real Estate Investment Trusts (REITs)") {
      try {
        const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const classification = await groqClient.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          temperature: 0,
          messages: [{ role: "user", content: `You are an expert financial classifier. Classify the REIT sub-industry for ${companyName} (${resolvedTicker}). Return STRICTLY ONE of the following exactly as written: Hotel REIT, Retail REIT, Industrial REIT, Infrastructure REIT, Office REIT, Residential REIT, or Generic REIT. Do not return any other text.` }]
        });
        const sub = classification.choices[0].message.content.trim();
        if (sub.includes("REIT")) {
          sector = sub;
        }
      } catch (err) {
        console.error("Failed to classify REIT sub-industry:", err.message);
      }
    }
  } catch (err) {
    console.error("Finnhub initial lookup failed:", err.message);
  }

  const sessionId = uuidv4();
  const agent = new GuidedReActAgent(sessionId);
  const scorer = new SectorAwareScorer();
  const emit = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    for await (const event of agent.run(resolvedTicker, companyName, sector, query)) {
      emit(event);
    }

    const memory = new ShortTermMemory(sessionId);
    const observations = await memory.getObservations();
    const scoreResult = scorer.score(observations, sector);

    const reasoningResponse = await agent.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a professional equity research analyst AI. Keep your answers extremely concise, strictly under 100 words." },
        { role: "user", content: `Write a concise 1-2paragraph professional reasoning (maximum 250 words) based on these calculated metrics for ${resolvedTicker} (${companyName}) in the ${sector} sector:\nComposite Score: ${scoreResult.composite_score}\nVerdict: ${scoreResult.verdict}\nBreakdown: ${JSON.stringify(scoreResult.breakdown)}` }
      ]
    });
    const finalReasoning = reasoningResponse.choices[0].message.content;

    // Construct the requested final payload
    const risks = Object.entries(scoreResult.breakdown)
      .filter(([_, v]) => v.score < 50 && v.hasData)
      .map(([k, v]) => `Low ${k.replace(/_/g, " ")} (${Math.round(v.score)}/100)`);

    const finalPayload = {
      company: companyName,
      ticker: resolvedTicker,
      marketCap: scoreResult.marketCap,
      currentPrice: scoreResult.rawData.currentPrice,
      score: scoreResult.composite_score,
      metrics: scoreResult.breakdown,
      rawData: scoreResult.rawData,
      peerComparison: scoreResult.breakdown.peer_rank?.raw || null,
      risks: risks,
      summary: finalReasoning,
      news: scoreResult.news || [],
      filings: [] // Can be expanded if needed
    };

    // Store the complete analysis in Redis
    await redis.set(`research:${sessionId}`, JSON.stringify(finalPayload), "EX", 3600);

    emit({ type: "score", ...scoreResult });
    emit({ type: "final_reasoning", content: finalReasoning, sessionId });
    emit({ type: "research_complete", data: finalPayload });

    // Proactively generate and cache TTS
    try {
      const ai = new GoogleGenAI({ apiKey: process.env["gemini-3.1-flash-live-preview_api"] });
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: 'Speak this exact text: ' + finalReasoning,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } }
        }
      });
      const base64Pcm = ttsResponse.candidates[0].content.parts[0].inlineData.data;
      const pcmBuffer = Buffer.from(base64Pcm, 'base64');
      const wavHeader = Buffer.alloc(44);
      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16);
      wavHeader.writeUInt16LE(1, 20);
      wavHeader.writeUInt16LE(1, 22);
      wavHeader.writeUInt32LE(24000, 24);
      wavHeader.writeUInt32LE(24000 * 2, 28);
      wavHeader.writeUInt16LE(2, 32);
      wavHeader.writeUInt16LE(16, 34);
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(pcmBuffer.length, 40);
      const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

      await redis.set(`tts:${sessionId}`, wavBuffer, "EX", 3600);
      emit({ type: "tts_ready", sessionId });
    } catch (ttsErr) {
      console.error("Proactive TTS generation failed:", ttsErr.message);
    }

    emit({ type: "done" });
  } catch (err) {
    console.error("Research error:", err);
    emit({ type: "error", message: err.message });
  } finally {
    res.end();
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/tts/:sessionId", async (req, res) => {
  try {
    const wavBuffer = await redis.getBuffer(`tts:${req.params.sessionId}`);
    if (!wavBuffer) return res.status(404).json({ error: "Audio not found or expired" });

    res.setHeader('Content-Type', 'audio/wav');
    res.send(wavBuffer);
  } catch (error) {
    console.error("TTS fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { sessionId, message, history = [] } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const contextData = await redis.get(`research:${sessionId}`);
    const context = contextData ? JSON.parse(contextData) : null;

    let systemPrompt = `You are a context-aware research assistant.
Answer ONLY using:
1. Current research
2. Financial knowledge
Never perform new research.
If data is unavailable, say so.`;

    if (context) {
      systemPrompt += `\n\nContext:\nCompany: ${context.company} (${context.ticker})\nMarket Cap: ${context.marketCap ? "$" + context.marketCap : "Unavailable"}\nScore: ${context.score}\nScored Metrics: ${JSON.stringify(context.metrics, null, 2)}\nAll Raw Financial Data: ${JSON.stringify(context.rawData, null, 2)}\nRisks: ${JSON.stringify(context.risks)}\nSummary: ${context.summary}`;
    } else {
      systemPrompt += `\n\nContext: (No research data found for this session)`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const stream = await groqClient.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.2,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);
attachGeminiLive(httpServer);
httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
