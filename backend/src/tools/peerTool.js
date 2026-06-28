import Groq from "groq-sdk";
import { GROQ_API_KEY } from "../config.js";
import { getMarketData } from "./finnhubTool.js";
import { extractMetric } from "./edgarTool.js";

const client = new Groq({ apiKey: GROQ_API_KEY });

export async function getAdvancedPeerComparison(ticker, sector) {
  try {
    // 1. Use Groq to get top 3 peers
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a financial data assistant. Reply ONLY with a comma-separated list of exactly 3 stock tickers for the top publicly traded competitors of the given company. No other text."
        },
        {
          role: "user",
          content: `Company: ${ticker}\nSector: ${sector}\nTop 3 competitor tickers:`
        }
      ]
    });

    const rawPeers = response.choices[0].message.content || "";
    const peers = rawPeers.split(",").map(p => p.trim().toUpperCase()).filter(p => p && p !== ticker).slice(0, 3);
    
    if (peers.length === 0) {
      return { error: "Failed to identify peers using Groq API." };
    }

    const allTickers = [ticker, ...peers];
    const results = {};

    // 2. Gather data for all tickers
    for (const t of allTickers) {
      try {
        const market = await getMarketData(t).catch(() => ({}));
        const rev = await extractMetric(t, "revenue_growth").catch(() => ({ data: [] }));
        const eps = await extractMetric(t, "eps").catch(() => ({ data: [] }));

        // Calculate YoY or QoQ growth
        let revGrowth = null;
        if (rev.data.length >= 5) revGrowth = (rev.data[0].value - rev.data[4].value) / Math.abs(rev.data[4].value);
        else if (rev.data.length >= 2) revGrowth = (rev.data[0].value - rev.data[1].value) / Math.abs(rev.data[1].value);

        let epsGrowth = null;
        if (eps.data.length >= 5) epsGrowth = (eps.data[0].value - eps.data[4].value) / Math.abs(eps.data[4].value);
        else if (eps.data.length >= 2) epsGrowth = (eps.data[0].value - eps.data[1].value) / Math.abs(eps.data[1].value);

        results[t] = {
          peRatio: market.peRatio ?? null,
          revenueGrowth: revGrowth,
          epsGrowth: epsGrowth
        };
      } catch (e) {
        results[t] = { error: e.message };
      }
    }

    // 3. Calculate rank (0.0 to 1.0) based on Revenue Growth compared to peers
    let rank = 0.5; // Default average
    let validPeers = 0;
    const targetRev = results[ticker]?.revenueGrowth;
    if (targetRev !== null && targetRev !== undefined) {
      let betterThanCount = 0;
      for (const p of peers) {
        const peerRev = results[p]?.revenueGrowth;
        if (peerRev !== null && peerRev !== undefined) {
          validPeers++;
          if (targetRev >= peerRev) betterThanCount++;
        }
      }
      if (validPeers > 0) {
        rank = betterThanCount / validPeers; // 1.0 if better than all, 0.0 if worse than all
      }
    }

    let confidence = 0.85; // LLM generated peers have inherent uncertainty
    if (validPeers === 0) confidence = 0.2;

    return {
      tool: "peer_comparison",
      confidence,
      ticker,
      peers,
      comparison: results,
      peer_rank: rank,
      summary: `Analyzed peers via Groq: ${peers.join(", ")}. Target rank calculated as ${rank} based on relative growth metrics.`
    };

  } catch (err) {
    return {
      error: {
        type: "LLM_ERROR",
        message: `Advanced peer comparison failed: ${err.message}`,
        retryable: true
      }
    };
  }
}
