import axios from "axios";
import { FINNHUB_API_KEY } from "../config.js";

const BASE = "https://finnhub.io/api/v1";

export async function getMarketData(ticker) {
  try {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 14);
    const to = toDate.toISOString().split('T')[0];
    const from = fromDate.toISOString().split('T')[0];

    const [quote, profile, metrics, newsRes] = await Promise.all([
      axios.get(`${BASE}/quote`,          { params: { symbol: ticker, token: FINNHUB_API_KEY } }),
      axios.get(`${BASE}/stock/profile2`, { params: { symbol: ticker, token: FINNHUB_API_KEY } }),
      axios.get(`${BASE}/stock/metric`,   { params: { symbol: ticker, metric: "all", token: FINNHUB_API_KEY } }),
      axios.get(`${BASE}/company-news`,   { params: { symbol: ticker, from, to, token: FINNHUB_API_KEY } }).catch(() => ({ data: [] }))
    ]);

    const q = quote.data;
    const p = profile.data;
    const m = metrics.data?.metric ?? {};
    const n = Array.isArray(newsRes.data) ? newsRes.data.slice(0, 3) : [];

    let confidence = 0.99;
    if (!p.name) confidence -= 0.3;
    if (q.c === 0 || !q.c) confidence -= 0.4;

    return {
      tool: "finnhub",
      confidence: Number(Math.max(0, confidence).toFixed(2)),
      ticker,
      companyName:   p.name,
      sector:        p.finnhubIndustry,
      currentPrice:  q.c,
      marketCap:     p.marketCapitalization,
      volume:        q.v,
      high52w:       m["52WeekHigh"],
      low52w:        m["52WeekLow"],
      beta:          m.beta,
      peRatio:       m.peBasicExclExtraTTM,
      psRatio:       m.psTTM,
      pbRatio:       m.pbQuarterly,
      dividendYield: m.dividendYieldIndicatedAnnual,
      news:          n,
    };
  } catch (error) {
    let type = "NETWORK_ERROR";
    let retryable = true;
    if (error.response?.status === 429) type = "RATE_LIMIT";
    if (error.response?.status === 404 || error.response?.status === 400) {
      type = "INPUT_ERROR";
      retryable = false;
    }
    return {
      error: {
        type,
        message: `Finnhub API Error: ${error.message}`,
        retryable
      }
    };
  }
}
