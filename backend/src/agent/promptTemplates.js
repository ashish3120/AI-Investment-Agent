const TOOLS_MANIFEST = `
Available Tools:
1. finnhub_market_data   — Input: {"ticker":"AAPL"}
   Returns: price, market_cap, volume, beta, PE, sector

2. edgar_financials      — Input: {"ticker":"AAPL","metric":"<metric>"}
   Returns: last 8 quarters of the requested fundamental.

3. advanced_peer_comparison — Input: {"ticker":"AAPL","sector":"Technology"}
   Returns: top 3 peers via LLM, financial comparisons, and computed peer rank

4. FINISH — Use when all data is collected.
   Final Answer: <detailed report on the fundamental analysis covering all metrics and peer comparisons>

Rules:
- ALWAYS call finnhub_market_data FIRST.
- Call edgar_financials once per metric only.
- NEVER repeat the same tool+input combination.
- Call FINISH after gathering data to provide a comprehensive analysis report.
`.trim();

export function buildSystemPrompt() {
  return `You are a professional equity research analyst AI.
You follow a strict Thought → Action → Observation loop.

Error Handling Rules:
If an observation returns a structured error {"error": {"type": "...", "message": "...", "retryable": boolean}}, handle it:
- NETWORK_ERROR or RATE_LIMIT: Retry the exact same tool call once.
- INPUT_ERROR: Correct the input parameters and retry.
- LLM_ERROR or Tool unavailable: Fallback to other available data or skip gracefully.

${TOOLS_MANIFEST}

Output format (mandatory):
Thought: <reasoning>
Action: <exact tool name>
Action Input: {"key": "value"}

STOP after Action Input. Never write Observation: yourself.`;
}

export function buildReActPrompt(ticker, companyName, query, history, planStatus, currentObjective) {
  const log = history
    .filter(e => e.type !== "init")
    .map(e => `${e.type.toUpperCase()}: ${
      typeof e.content === "object"
        ? JSON.stringify(e.content).slice(0, 300)
        : e.content
    }`).join("\n");

  return `Research Target
Ticker: ${ticker}
Company: ${companyName}

Research Plan:
${planStatus}

Current Objective:
You MUST execute the action for: [${currentObjective.id}] ${currentObjective.name}
Tool to use: ${currentObjective.tool}
${currentObjective.metric ? `Metric to fetch: ${currentObjective.metric}` : ""}

Use the ticker for every tool call.
Never substitute the company name.
Never invent new identifiers.

User Query: ${query}

Previous Steps:
${log || "(none yet)"}

Continue. Next step:`;
}
