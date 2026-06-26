export const SECTOR_WEIGHTS = {
  Technology: {
    revenue_growth: 0.30, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.20,
  },
  Financials: {
    nim: 0.30, loan_growth: 0.25, tier_1_capital: 0.25, roe_roic: 0.20,
  },
  Healthcare: {
    revenue_growth: 0.20, operating_margin: 0.20, eps: 0.15, medical_cost_ratio: 0.20, fcf: 0.15, roe_roic: 0.10,
  },
  Energy: {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.30, roe_roic: 0.30,
  },
  "Consumer Discretionary": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.25,
  },
  DEFAULT: {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.25,
  },
};
