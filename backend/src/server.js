import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { GuidedReActAgent } from "./agent/reactAgent.js";
import { SectorAwareScorer } from "./scorer/scorer.js";
import { ShortTermMemory } from "./agent/memory.js";
import redis from "./redisClient.js";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/research", async (req, res) => {
  const { ticker: rawTicker, query = "Full fundamental analysis" } = req.query;
  if (!rawTicker) return res.status(400).json({ error: "ticker is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let resolvedTicker = rawTicker.toUpperCase();
  let companyName = rawTicker;
  let sector = "Technology"; // default

  try {
    const symbolRes = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(rawTicker)}&token=${process.env.FINNHUB_API_KEY}`);
    const symbolData = await symbolRes.json();
    if (symbolData.result && symbolData.result.length > 0) {
      resolvedTicker = symbolData.result[0].symbol;
      companyName = symbolData.result[0].description;
    }

    const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${resolvedTicker}&token=${process.env.FINNHUB_API_KEY}`);
    const profileData = await profileRes.json();
    if (profileData && profileData.finnhubIndustry) {
      sector = profileData.finnhubIndustry;
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

    emit({ type: "score", ...scoreResult });
    emit({ type: "final_reasoning", content: finalReasoning, sessionId });

    // Proactively generate and cache TTS
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.gemini_api_key });
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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// Trigger restart

