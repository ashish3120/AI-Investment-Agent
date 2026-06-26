const METRIC_LABELS = {
  revenue_growth: "Revenue growth",
  gross_margin:   "Gross margin",
  eps_growth:     "EPS growth",
  fcf:            "Free cash flow",
  debt:           "Debt level",
  roe_roic:       "ROE / ROIC",
  dilution:       "Share dilution",
  peer_rank:      "Peer rank",
};

function barColor(score) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function barGlow(score) {
  if (score >= 75) return "shadow-emerald-500/30";
  if (score >= 50) return "shadow-amber-500/30";
  return "shadow-red-500/30";
}

function scoreColor(score) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export default function ScoreBreakdown({ breakdown }) {
  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
          Score Breakdown
        </span>
      </div>
      <div className="space-y-3">
        {Object.entries(breakdown).map(([key, val], index) => (
          <div
            key={key}
            className="grid grid-cols-[110px_1fr_36px] sm:grid-cols-[130px_1fr_36px] items-center gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className="text-xs text-slate-500 truncate">
              {METRIC_LABELS[key] ?? key}
            </span>
            {val.hasData === false ? (
              <span className="text-[10px] text-slate-600 italic col-span-2 truncate" title={val.reasonMissing || "No data"}>
                {val.reasonMissing || "No data"}
              </span>
            ) : (
              <>
                <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${barColor(val.score)} ${barGlow(val.score)}`}
                    style={{ width: `${val.score}%` }}
                  />
                </div>
                <span className={`text-xs text-right font-mono font-medium ${scoreColor(val.score)}`}>
                  {val.score}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
