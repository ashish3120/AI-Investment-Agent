const THRESHOLDS = {
  revenue_growth:     { excellent: 0.25, good: 0.12, avg: 0.05, poor: 0.00, invert: false },
  gross_margin:       { excellent: 0.70, good: 0.50, avg: 0.30, poor: 0.15, invert: false },
  operating_margin:   { excellent: 0.40, good: 0.25, avg: 0.15, poor: 0.05, invert: false },
  eps_growth:         { excellent: 0.30, good: 0.15, avg: 0.05, poor:-0.05, invert: false },
  fcf:                { excellent: 0.15, good: 0.08, avg: 0.03, poor: 0.00, invert: false },
  debt:               { excellent: 0.20, good: 0.50, avg: 1.00, poor: 2.00, invert: true  },
  roe_roic:           { excellent: 0.25, good: 0.15, avg: 0.08, poor: 0.00, invert: false },
  dilution:           { excellent: 0.00, good:-0.01, avg:-0.02, poor:-0.05, invert: false },
  peer_rank:          { excellent: 1.00, good: 0.75, avg: 0.50, poor: 0.25, invert: false },
  medical_cost_ratio: { excellent: 0.75, good: 0.82, avg: 0.88, poor: 0.95, invert: true  },
  nim:                { excellent: 0.04, good: 0.03, avg: 0.02, poor: 0.01, invert: false },
  loan_growth:        { excellent: 0.15, good: 0.08, avg: 0.04, poor: 0.00, invert: false },
  tier_1_capital:     { excellent: 0.13, good: 0.10, avg: 0.08, poor: 0.06, invert: false },
};

export function normalize(metric, value) {
  const t = THRESHOLDS[metric];
  if (!t) return 50;
  if (t.invert) {
    if (value <= t.excellent) return 95;
    if (value <= t.good)      return 75;
    if (value <= t.avg)       return 50;
    if (value <= t.poor)      return 25;
    return 10;
  } else {
    if (value >= t.excellent) return 95;
    if (value >= t.good)      return 75;
    if (value >= t.avg)       return 50;
    if (value >= t.poor)      return 25;
    return 10;
  }
}
