export const SECTOR_WEIGHTS = {

  // ── TECHNOLOGY ────────────────────────────────────────────────────────────
  "Technology": {
    revenue_growth: 0.30, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.20,
  },
  "Semiconductors": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.20, roe_roic: 0.15, eps_growth: 0.15,
  },
  "Software (SaaS)": {
    revenue_growth: 0.30, gross_margin: 0.25, arr_growth: 0.20, fcf: 0.15, net_revenue_retention: 0.10,
  },
  "Software (Enterprise)": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.10,
  },
  "IT Services": {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.20, eps_growth: 0.15,
  },
  "Cloud Infrastructure": {
    revenue_growth: 0.35, gross_margin: 0.25, fcf: 0.20, roe_roic: 0.10, capex_intensity: 0.10,
  },
  "Cybersecurity": {
    revenue_growth: 0.30, gross_margin: 0.30, arr_growth: 0.20, fcf: 0.10, eps_growth: 0.10,
  },
  "Hardware & Electronics": {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.20, inventory_turns: 0.15,
  },
  "Internet & E-Commerce": {
    revenue_growth: 0.30, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.10,
  },
  "Fintech": {
    revenue_growth: 0.30, gross_margin: 0.25, fcf: 0.20, roe_roic: 0.15, eps_growth: 0.10,
  },
  "AI & Machine Learning": {
    revenue_growth: 0.35, gross_margin: 0.25, fcf: 0.20, roe_roic: 0.10, r_and_d_intensity: 0.10,
  },

  // ── FINANCIALS ────────────────────────────────────────────────────────────
  "Financials": {
    nim: 0.30, loan_growth: 0.25, tier_1_capital: 0.25, roe_roic: 0.20,
  },
  "Banks (Large Cap)": {
    nim: 0.25, loan_growth: 0.20, tier_1_capital: 0.20, roe_roic: 0.20, efficiency_ratio: 0.15,
  },
  "Banks (Regional)": {
    nim: 0.30, loan_growth: 0.25, tier_1_capital: 0.20, roe_roic: 0.15, npl_ratio: 0.10,
  },
  "Insurance": {
    combined_ratio: 0.30, premium_growth: 0.20, investment_yield: 0.20, roe_roic: 0.20, solvency_ratio: 0.10,
  },
  "Asset Management": {
    aum_growth: 0.30, fee_margin: 0.25, roe_roic: 0.25, eps_growth: 0.20,
  },
  "Investment Banking": {
    revenue_growth: 0.25, roe_roic: 0.30, eps_growth: 0.25, leverage_ratio: 0.20,
  },
  "Consumer Finance": {
    revenue_growth: 0.20, nim: 0.25, credit_loss_rate: 0.25, roe_roic: 0.20, eps_growth: 0.10,
  },
  "Payments & Transaction": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.10,
  },

  // ── HEALTHCARE ────────────────────────────────────────────────────────────
  "Healthcare": {
    revenue_growth: 0.20, operating_margin: 0.20, eps: 0.15, medical_cost_ratio: 0.20, fcf: 0.15, roe_roic: 0.10,
  },
  "Pharmaceuticals (Large Cap)": {
    revenue_growth: 0.15, gross_margin: 0.25, pipeline_value: 0.25, fcf: 0.20, roe_roic: 0.15,
  },
  "Pharmaceuticals (Specialty)": {
    revenue_growth: 0.25, gross_margin: 0.25, pipeline_value: 0.20, fcf: 0.15, eps_growth: 0.15,
  },
  "Biotechnology": {
    revenue_growth: 0.20, pipeline_value: 0.35, gross_margin: 0.20, cash_runway: 0.15, r_and_d_intensity: 0.10,
  },
  "Medical Devices": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.20, roe_roic: 0.15, r_and_d_intensity: 0.15,
  },
  "Healthcare Services": {
    revenue_growth: 0.20, operating_margin: 0.25, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.15,
  },
  "Managed Care": {
    revenue_growth: 0.15, medical_cost_ratio: 0.30, operating_margin: 0.25, fcf: 0.15, membership_growth: 0.15,
  },
  "Diagnostics & Life Sciences": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.10,
  },

  // ── ENERGY ───────────────────────────────────────────────────────────────
  "Energy": {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.30, roe_roic: 0.30,
  },
  "Oil & Gas (Integrated)": {
    fcf: 0.30, reserve_replacement: 0.20, roe_roic: 0.20, debt: 0.15, dividend_coverage: 0.15,
  },
  "Oil & Gas (E&P)": {
    fcf: 0.30, reserve_replacement: 0.25, production_growth: 0.20, debt: 0.15, breakeven_cost: 0.10,
  },
  "Oil & Gas (Midstream)": {
    fcf: 0.25, distribution_coverage: 0.25, debt: 0.20, revenue_growth: 0.15, contract_backlog: 0.15,
  },
  "Oil & Gas (Refining)": {
    crack_spread: 0.30, fcf: 0.25, gross_margin: 0.20, roe_roic: 0.15, debt: 0.10,
  },
  "Renewable Energy": {
    revenue_growth: 0.20, fcf: 0.25, capacity_growth: 0.25, debt: 0.15, roe_roic: 0.15,
  },
  "Utilities (Electric)": {
    eps_growth: 0.20, dividend_coverage: 0.25, debt: 0.25, rate_base_growth: 0.15, roe_roic: 0.15,
  },
  "Utilities (Gas)": {
    eps_growth: 0.20, dividend_coverage: 0.25, debt: 0.25, revenue_growth: 0.15, roe_roic: 0.15,
  },
  "Utilities (Multi)": {
    eps_growth: 0.20, dividend_coverage: 0.25, debt: 0.20, revenue_growth: 0.20, roe_roic: 0.15,
  },

  // ── CONSUMER ─────────────────────────────────────────────────────────────
  "Consumer Discretionary": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.25,
  },
  "Consumer Staples": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.20, dividend_coverage: 0.15,
  },
  "Retail (General)": {
    revenue_growth: 0.20, gross_margin: 0.20, same_store_sales: 0.20, fcf: 0.20, inventory_turns: 0.20,
  },
  "Retail (Luxury)": {
    revenue_growth: 0.25, gross_margin: 0.30, same_store_sales: 0.20, fcf: 0.15, roe_roic: 0.10,
  },
  "Retail (Online)": {
    revenue_growth: 0.30, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.10,
  },
  "Restaurants & Food Service": {
    revenue_growth: 0.20, same_store_sales: 0.25, operating_margin: 0.25, fcf: 0.15, unit_growth: 0.15,
  },
  "Food & Beverage": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.20, dividend_coverage: 0.15,
  },
  "Apparel & Footwear": {
    revenue_growth: 0.20, gross_margin: 0.25, same_store_sales: 0.20, fcf: 0.20, inventory_turns: 0.15,
  },
  "Household Products": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.30, roe_roic: 0.15, dividend_coverage: 0.15,
  },
  "Autos & EV": {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.25, delivery_growth: 0.20, debt: 0.15,
  },
  "Gaming & Leisure": {
    revenue_growth: 0.25, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.15,
  },
  "Travel & Hospitality": {
    revenue_growth: 0.25, operating_margin: 0.25, fcf: 0.20, roe_roic: 0.15, revpar: 0.15,
  },
  "Airlines": {
    revenue_growth: 0.15, load_factor: 0.20, operating_margin: 0.25, fcf: 0.25, debt: 0.15,
  },

  // ── INDUSTRIALS ───────────────────────────────────────────────────────────
  "Industrials": {
    revenue_growth: 0.20, operating_margin: 0.25, fcf: 0.25, roe_roic: 0.20, eps_growth: 0.10,
  },
  "Aerospace & Defense": {
    revenue_growth: 0.15, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.20, backlog_coverage: 0.20,
  },
  "Construction & Engineering": {
    revenue_growth: 0.20, operating_margin: 0.20, fcf: 0.20, backlog_coverage: 0.20, roe_roic: 0.20,
  },
  "Transportation & Logistics": {
    revenue_growth: 0.20, operating_margin: 0.25, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.15,
  },
  "Machinery & Equipment": {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.20, backlog_coverage: 0.15,
  },
  "Chemicals": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.20, eps_growth: 0.15,
  },
  "Mining & Materials": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.30, roe_roic: 0.20, debt: 0.10,
  },
  "Steel & Metals": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.30, roe_roic: 0.20, debt: 0.10,
  },
  "Paper & Packaging": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.30, roe_roic: 0.15, debt: 0.15,
  },
  "Agriculture": {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.25, roe_roic: 0.20, eps_growth: 0.15,
  },

  // ── REAL ESTATE ───────────────────────────────────────────────────────────
  "Hotel REIT": {
    ffo: 0.20, affo: 0.20, occupancy: 0.15, adr: 0.15, revpar: 0.15, debt: 0.10, dividend_coverage: 0.05,
  },
  "Retail REIT": {
    ffo: 0.25, occupancy: 0.20, same_store_noi: 0.20, leasing_spread: 0.15, affo: 0.20,
  },
  "Industrial REIT": {
    ffo: 0.25, affo: 0.25, occupancy: 0.20, same_store_noi: 0.15, debt: 0.15,
  },
  "Office REIT": {
    ffo: 0.25, occupancy: 0.25, same_store_noi: 0.20, leasing_spread: 0.15, debt: 0.15,
  },
  "Residential REIT": {
    ffo: 0.25, occupancy: 0.20, same_store_noi: 0.25, affo: 0.15, debt: 0.15,
  },
  "Data Center REIT": {
    ffo: 0.20, affo: 0.20, revenue_growth: 0.20, occupancy: 0.20, debt: 0.10, eps_growth: 0.10,
  },
  "Healthcare REIT": {
    ffo: 0.25, affo: 0.20, occupancy: 0.20, same_store_noi: 0.20, debt: 0.15,
  },
  "Generic REIT": {
    ffo: 0.30, affo: 0.30, occupancy: 0.20, debt: 0.20,
  },

  // ── TELECOM & MEDIA ───────────────────────────────────────────────────────
  "Telecom": {
    revenue_growth: 0.15, ebitda_margin: 0.25, fcf: 0.25, arpu_growth: 0.15, debt: 0.20,
  },
  "Media & Entertainment": {
    revenue_growth: 0.20, gross_margin: 0.20, fcf: 0.25, subscriber_growth: 0.20, roe_roic: 0.15,
  },
  "Streaming & Digital Media": {
    revenue_growth: 0.30, gross_margin: 0.20, subscriber_growth: 0.25, fcf: 0.15, arpu_growth: 0.10,
  },
  "Advertising & Marketing": {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.15, eps_growth: 0.10,
  },

  // ── DEFAULT ───────────────────────────────────────────────────────────────
  DEFAULT: {
    revenue_growth: 0.25, gross_margin: 0.25, fcf: 0.25, roe_roic: 0.25,
  },
};

// ── ADDITIONS: missing GICS parent entries + sub-sectors ─────────────────

// Replaces the trailing DEFAULT export — append before it in your file.
// These 5 entries fill the two gaps identified above.

export const SECTOR_WEIGHTS_ADDITIONS = {

  // Communication Services — Finnhub returns this exact string for META, GOOGL, etc.
  "Communication Services": {
    revenue_growth: 0.25, gross_margin: 0.20, fcf: 0.20,
    subscriber_growth: 0.15, arpu_growth: 0.10, roe_roic: 0.10,
  },
  // Social Media — sub-sector under Communication Services
  "Social Media": {
    revenue_growth: 0.25, gross_margin: 0.25, arpu_growth: 0.20,
    dau_growth: 0.15, fcf: 0.15,
  },
  // Drug Retail — sub-sector under Consumer Staples (CVS, Walgreens)
  "Drug Retail": {
    revenue_growth: 0.15, gross_margin: 0.20, same_store_sales: 0.20,
    fcf: 0.25, roe_roic: 0.20,
  },
  // Materials — Finnhub returns this exact string for LIN, APD, NEM, etc.
  "Materials": {
    revenue_growth: 0.15, gross_margin: 0.25, fcf: 0.25,
    roe_roic: 0.20, debt: 0.15,
  },
  // Specialty Chemicals — sub-sector under Materials
  "Specialty Chemicals": {
    revenue_growth: 0.20, gross_margin: 0.30, fcf: 0.25,
    roe_roic: 0.15, r_and_d_intensity: 0.10,
  },
};