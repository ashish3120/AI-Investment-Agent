import { SECTOR_WEIGHTS } from "./sectorWeights.js";
import { normalize } from "./normalizer.js";

export class SectorAwareScorer {
  score(observations, sector) {
    const weights   = SECTOR_WEIGHTS[sector] ?? SECTOR_WEIGHTS.DEFAULT;
    const raw       = this._extractMetrics(observations);
    const breakdown = {};

    let totalConfidence = 0;
    let confidenceCount = 0;
    for (const obs of observations) {
      if (obs.content?.confidence !== undefined) {
         totalConfidence += obs.content.confidence;
         confidenceCount++;
      }
    }
    const data_confidence = confidenceCount > 0 ? (totalConfidence / confidenceCount) : 1.0;

    for (const [metric, weight] of Object.entries(weights)) {
      const val   = raw[metric] ?? null;
      const score = val !== null ? normalize(metric, val) : null;
      let reasonMissing = null;
      if (val === null && metric === 'peer_rank' && raw.peer_rank_error) {
        reasonMissing = raw.peer_rank_error;
      }
      breakdown[metric] = { raw: val, score: score ?? 50, hasData: val !== null, weight, reasonMissing };
    }

    const composite = Object.values(breakdown).reduce(
      (sum, v) => sum + v.score * v.weight, 0
    );

    return {
      sector,
      composite_score: Math.round(composite * 10) / 10,
      data_confidence: Math.round(data_confidence * 100) / 100,
      grade:   this._grade(composite),
      verdict: this._verdict(composite, sector, data_confidence),
      breakdown,
      marketCap: raw.marketCap,
      news: raw.news,
    };
  }

  _extractMetrics(observations) {
    const metrics = {};
    for (const obs of observations) {
      const { content, tool } = obs;
      if (typeof content !== "object" || !content) continue;

      if (tool === "edgar_financials") {
        if (!content.data) continue;
        const vals = content.data.map(d => d.value);
        switch (content.metric) {
          case "revenue_growth":
          case "loan_growth":
          case "ffo":
          case "affo":
          case "same_store_noi":
            if (vals.length >= 5) metrics[content.metric] = (vals[0] - vals[4]) / Math.abs(vals[4]);
            else if (vals.length >= 2) metrics[content.metric] = (vals[0] - vals[1]) / Math.abs(vals[1]);
            break;
          case "eps":
            if (vals.length >= 5) metrics.eps_growth = (vals[0] - vals[4]) / Math.abs(vals[4]);
            else if (vals.length >= 2) metrics.eps_growth = (vals[0] - vals[1]) / Math.abs(vals[1]);
            break;
          case "dilution":
            if (vals.length >= 5) metrics.dilution = (vals[0] - vals[4]) / Math.abs(vals[4]);
            else if (vals.length >= 2) metrics.dilution = (vals[0] - vals[1]) / Math.abs(vals[1]);
            break;
          case "gross_margin":
          case "operating_margin":
          case "medical_cost_ratio":
          case "nim":
          case "tier_1_capital":
            if (vals.length >= 1) metrics[content.metric] = vals[0] / 1e9; // Basic absolute/ratio usage
            break;
          case "occupancy":
          case "adr":
          case "revpar":
          case "leasing_spread":
          case "dividend_coverage":
            if (vals.length >= 1) metrics[content.metric] = vals[0];
            break;
          case "fcf":
            if (vals.length >= 1) metrics.fcf = vals[0] / 1e9;
            break;
          case "debt":
            if (vals.length >= 1) metrics.debt = vals[0] / 1e9;
            break;
          case "roe_roic":
            if (vals.length >= 1) metrics.roe_roic = vals[0] / 1e9; // normalizer expects ratio but raw is abs
            break;
        }
      } else if (tool === "advanced_peer_comparison") {
        if (content.peer_rank !== undefined) {
          metrics.peer_rank = content.peer_rank;
        } else if (content.error) {
          metrics.peer_rank_error = content.error;
        }
      } else if (tool === "finnhub_market_data") {
        if (content.marketCap !== undefined) {
          metrics.marketCap = content.marketCap;
        }
        if (content.news) {
          metrics.news = content.news;
        }
      }
    }
    return metrics;
  }

  _grade(s) {
    if (s >= 85) return "A+";
    if (s >= 78) return "A";
    if (s >= 70) return "B+";
    if (s >= 62) return "B";
    if (s >= 55) return "C+";
    if (s >= 45) return "C";
    return "D";
  }

  _verdict(s, sector, conf) {
    let text = "";
    if (s >= 78) text = `Strong fundamentals for a ${sector} company. Above-peer performance.`;
    else if (s >= 60) text = `Mixed picture. Some strengths but watch margins and debt.`;
    else text = `Below-average for ${sector}. Elevated risk — proceed with caution.`;

    if (conf < 0.7) {
      text += ` (Warning: Low data confidence ${Math.round(conf * 100)}% - handle with care)`;
    }
    return text;
  }
}
