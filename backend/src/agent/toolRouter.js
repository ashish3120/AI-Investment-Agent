import { getMarketData } from "../tools/finnhubTool.js";
import { extractMetric } from "../tools/edgarTool.js";
import { getAdvancedPeerComparison } from "../tools/peerTool.js";

export class ToolRouter {
  async call(toolName, toolInput) {
    switch (toolName) {
      case "finnhub_market_data":    return getMarketData(toolInput.ticker);
      case "edgar_financials":       return extractMetric(toolInput.ticker, toolInput.metric);
      case "advanced_peer_comparison":  return getAdvancedPeerComparison(toolInput.ticker, toolInput.sector);
      default:                       return { error: { type: "INPUT_ERROR", message: `Unknown tool: ${toolName}`, retryable: false } };
    }
  }
}
