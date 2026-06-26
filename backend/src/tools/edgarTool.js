import axios from "axios";
import { SEC_USER_AGENT, FINNHUB_API_KEY } from "../config.js";

const BASE    = "https://data.sec.gov";
const HEADERS = { "User-Agent": SEC_USER_AGENT };

async function getCIK(ticker) {
  const { data } = await axios.get("https://www.sec.gov/files/company_tickers.json", { headers: HEADERS });
  const entry = Object.values(data).find(v => v.ticker.toUpperCase() === ticker.toUpperCase());
  if (!entry) throw new Error(`CIK not found for ${ticker}`);
  return String(entry.cik_str).padStart(10, "0");
}

async function getCompanyFacts(ticker) {
  const cik = await getCIK(ticker);
  const { data } = await axios.get(`${BASE}/api/xbrl/companyfacts/CIK${cik}.json`, { headers: HEADERS });
  return data;
}

const METRIC_MAP = {
  // General & Tech
  revenue_growth:     "Revenues",
  gross_margin:       "GrossProfit",
  fcf:                "NetCashProvidedByUsedInOperatingActivities",
  roe_roic:           "NetIncomeLoss",
  eps:                "EarningsPerShareBasic",
  // Healthcare
  operating_margin:   "OperatingIncomeLoss",
  medical_cost_ratio: "PolicyholderBenefitsAndClaimsIncurredNet",
  // Banks / Financials
  nim:                "NetInterestIncome",
  loan_growth:        "LoansAndLeasesReceivableNetOfDeferredIncome",
  tier_1_capital:     "Tier1Capital",
  // Real Estate / REITs
  ffo:                "FundsFromOperationsREIT",
  affo:               "AdjustedFundsFromOperationsREIT",
  occupancy:          "AreaOfRealEstatePropertyOccupancyPercentage",
  adr:                "AverageDailyRate",
  revpar:             "RevenuePerAvailableRoom",
  same_store_noi:     "SameStoreNetOperatingIncome",
  leasing_spread:     "LeasingSpread",
  dividend_coverage:  "DividendsCash",
};

export async function extractMetric(ticker, metric) {
  try {
    const facts   = await getCompanyFacts(ticker);
    const usGaap  = facts?.facts?.["us-gaap"] ?? {};
    
    let concept = METRIC_MAP[metric] ?? "Revenues";
    if (metric === "revenue_growth" && (!usGaap[concept] || !usGaap[concept].units)) {
      if (usGaap["RevenueFromContractWithCustomerExcludingAssessedTax"]) {
        concept = "RevenueFromContractWithCustomerExcludingAssessedTax";
      } else if (usGaap["SalesRevenueNet"]) {
        concept = "SalesRevenueNet";
      }
    }

    const unitData = usGaap[concept]?.units ?? {};
    const entries  = unitData.USD ?? unitData.shares ?? unitData["USD/shares"] ?? [];

    const quarterly = entries
      .filter(e => ["10-Q", "10-K"].includes(e.form) && e.frame && /^CY\d{4}Q[1-4]I?$/.test(e.frame))
      .sort((a, b) => new Date(b.end) - new Date(a.end))
      .slice(0, 8)
      .map(e => ({ period: e.end, value: e.val }));

    let confidence = 0.99;
    if (quarterly.length < 4) confidence = 0.6;
    if (quarterly.length === 0) confidence = 0.0;

    return { tool: "edgar", confidence, metric, concept, data: quarterly };
  } catch (error) {
    let type = "NETWORK_ERROR";
    let retryable = true;
    if (error.message.includes("CIK not found")) {
       type = "INPUT_ERROR";
       retryable = false;
    }
    return {
      error: {
        type,
        message: `EDGAR API Error: ${error.message}`,
        retryable
      }
    };
  }
}

export async function getPeerComparison(ticker, sector) {
  const { data: peers } = await axios.get(
    `https://finnhub.io/api/v1/stock/peers`,
    { params: { symbol: ticker, token: FINNHUB_API_KEY } }
  );
  const peerList = (peers ?? []).filter(p => p !== ticker).slice(0, 4);
  return { ticker, sector, peers: peerList };
}
