import { SECTOR_WEIGHTS } from "../scorer/sectorWeights.js";

export class ResearchPlanner {
  constructor(sector) {
    this.sector = sector;
    
    this.objectives = [
      { id: 1, name: "Market Data", tool: "finnhub_market_data", status: "pending" }
    ];

    const weights = SECTOR_WEIGHTS[sector] || SECTOR_WEIGHTS.DEFAULT;
    const metrics = Object.keys(weights).filter(m => m !== "peer_rank");

    let id = 2;
    for (const metric of metrics) {
      this.objectives.push({
        id: id++,
        name: metric,
        tool: "edgar_financials",
        metric,
        status: "pending"
      });
    }

    this.objectives.push({
      id: id++,
      name: "Peer Comparison",
      tool: "advanced_peer_comparison",
      status: "pending"
    });

    this.objectives.push({
      id: id++,
      name: "Investment Thesis",
      tool: "FINISH",
      status: "pending"
    });
  }

  updateObjective(toolName, metricName, observation) {
    const isSuccess = !observation.error;

    for (const obj of this.objectives) {
      if (obj.tool === toolName && obj.status === "pending") {
        if (toolName === "edgar_financials" && obj.metric !== metricName) {
          continue;
        }
        obj.status = isSuccess ? "completed" : "failed";
        
        // Circuit Breaker: If EDGAR fails with CIK not found, skip all remaining EDGAR tasks
        if (!isSuccess && toolName === "edgar_financials" && observation.error?.message?.includes("CIK not found")) {
           this.objectives.forEach(o => {
             if (o.tool === "edgar_financials" && o.status === "pending") {
               o.status = "failed"; // Skip gracefully
             }
           });
        }
        return;
      }
    }
  }

  getPlanStatus() {
    return this.objectives.map(o => 
      `[${o.status === "completed" ? "x" : o.status === "failed" ? "f" : " "}] ${o.id}. ${o.name} (${o.tool})`
    ).join("\n");
  }

  getNextObjective() {
    return this.objectives.find(o => o.status === "pending");
  }
}
