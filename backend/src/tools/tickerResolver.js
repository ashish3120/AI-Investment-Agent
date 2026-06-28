import Groq from "groq-sdk";
import { GROQ_API_KEY, FINNHUB_API_KEY } from "../config.js";

function filterOutInternationalSuffix(finnhubSymbol) {
  // If the symbol has no dot suffix, treat it as a potential clean US stock
  if (!finnhubSymbol.includes('.')) {
    return finnhubSymbol; 
  }

  // Split ticker and suffix away from each other
  const [ticker, suffix] = finnhubSymbol.split('.');

  // Explicit exceptions: US markets occasionally use suffixes for special share classes
  // (e.g., BRK.A or BRK.B for Berkshire Hathaway)
  const validUsSuffixes = ['A', 'B', 'C', 'W', 'U']; 

  if (validUsSuffixes.includes(suffix.toUpperCase())) {
    return finnhubSymbol; // Safe US class structure, keep it!
  }

  // Otherwise, it is an international market suffix code (e.g., .NS, .L, .HK)
  console.log(`[Filter] Blocked non-US ticker structure: "${finnhubSymbol}"`);
  return "PRIVATE_MARKET";
}

/**
 * Common brand/company name aliases that Finnhub's search API can't resolve.
 * Maps lowercase name → official US ticker symbol.
 */
const TICKER_ALIASES = {
  // Tech giants
  "google": "GOOGL",
  "alphabet": "GOOGL",
  "facebook": "META",
  "fb": "META",
  "meta": "META",
  "amazon": "AMZN",
  "apple": "AAPL",
  "microsoft": "MSFT",
  "tesla": "TSLA",
  "netflix": "NFLX",
  "nvidia": "NVDA",
  "twitter": "X",
  // Finance
  "berkshire": "BRK.B",
  "jpmorgan": "JPM",
  "jp morgan": "JPM",
  "goldman": "GS",
  "goldman sachs": "GS",
  "bank of america": "BAC",
  "wells fargo": "WFC",
  "morgan stanley": "MS",
  "visa": "V",
  "mastercard": "MA",
  // Consumer
  "coca cola": "KO",
  "coca-cola": "KO",
  "coke": "KO",
  "pepsi": "PEP",
  "pepsico": "PEP",
  "walmart": "WMT",
  "costco": "COST",
  "mcdonalds": "MCD",
  "mcdonald's": "MCD",
  "starbucks": "SBUX",
  "nike": "NKE",
  "disney": "DIS",
  // Pharma / Health
  "johnson and johnson": "JNJ",
  "johnson & johnson": "JNJ",
  "j&j": "JNJ",
  "pfizer": "PFE",
  "unitedhealth": "UNH",
  // Energy
  "exxon": "XOM",
  "exxonmobil": "XOM",
  "chevron": "CVX",
  // Other
  "salesforce": "CRM",
  "uber": "UBER",
  "airbnb": "ABNB",
  "snapchat": "SNAP",
  "snap": "SNAP",
  "spotify": "SPOT",
  "paypal": "PYPL",
  "shopify": "SHOP",
  "palantir": "PLTR",
  "broadcom": "AVGO",
  "amd": "AMD",
  "intel": "INTC",
};

/**
 * Resolves a user query (company name, brand, or ticker) to a valid stock ticker.
 * Resolution strategy:
 *   1. Check local alias map (instant, no API call)
 *   2. Try Finnhub symbol search API
 *   3. Fallback to Groq LLM for intelligent resolution
 *   4. Return uppercased raw input if all else fails
 */
export async function resolveTicker(rawInput) {
  const normalized = rawInput.trim().toLowerCase();

  // 1. Check local aliases first (covers most common cases like "google" → "GOOGL")
  if (TICKER_ALIASES[normalized]) {
    console.log(`[TickerResolver] Alias hit: "${rawInput}" → "${TICKER_ALIASES[normalized]}"`);
    return TICKER_ALIASES[normalized];
  }

  // 2. Try Finnhub symbol search
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(rawInput)}&token=${FINNHUB_API_KEY}`
    );
    const data = await res.json();

    if (data.result && data.result.length > 0) {
      // Prefer US common stock results
      const usStock = data.result.find(r => {
        const isCommonStock = r.type && r.type.toLowerCase() === "common stock";
        const isUsFormat = r.symbol && !r.symbol.includes(".") && !r.symbol.includes(":");
        return isCommonStock && isUsFormat;
      }) || data.result[0];

      console.log(`[TickerResolver] Finnhub search hit: "${rawInput}" → "${usStock.symbol}"`);
      return filterOutInternationalSuffix(usStock.symbol);
    }
  } catch (err) {
    console.warn(`[TickerResolver] Finnhub search failed for "${rawInput}":`, err.message);
  }

  // 3. Fallback: Use Groq LLM to resolve the ticker
  try {
    const groqClient = new Groq({ apiKey: GROQ_API_KEY });
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 20,
      messages: [
        {
          role: "system",
          content: "You convert company names or brand names to their official US stock ticker symbol. Reply with ONLY the ticker symbol (e.g., GOOGL, AAPL). If the input is a valid US ticker, return it as-is. If unsure return 'PRIVATE_MARKET', if the company is private, or if the company is NOT listed on a US stock market (such as international companies like TCS), you MUST return exactly: 'PRIVATE_MARKET'",
          role: "user",
          content: rawInput
        }
      ]
    });

    const resolved = response.choices[0].message.content.trim().toUpperCase();

    // Validate the LLM output looks like a real ticker (1-5 uppercase letters, possibly with a dot)
    if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(resolved) || resolved === "PRIVATE_MARKET") {
      console.log(`[TickerResolver] Groq LLM resolved: "${rawInput}" → "${resolved}"`);
      return resolved;
    }
  } catch (err) {
    console.warn(`[TickerResolver] Groq LLM fallback failed for "${rawInput}":`, err.message);
  }

  // 4. Last resort: return uppercased raw input
  console.log(`[TickerResolver] No resolution found, using raw: 'PRIVATE_MARKET'`);
  return 'PRIVATE_MARKET';
}
