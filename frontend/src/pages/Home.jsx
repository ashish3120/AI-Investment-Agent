import { useState } from "react";
import { useNavigate } from "react-router-dom";

const POPULAR_TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA"];

export default function Home() {
  const navigate = useNavigate();
  const [ticker, setTicker] = useState("");
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticker.trim()) {
      navigate(`/research/${ticker.toUpperCase()}?q=${encodeURIComponent(query || "Full fundamental analysis")}`);
    }
  };

  const handleQuickSelect = (t) => {
    setTicker(t);
    navigate(`/research/${t}?q=${encodeURIComponent("Full fundamental analysis")}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-10 relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            AI-Powered Research
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight gradient-text leading-tight">
            Research <span className="gradient-text-brand">Agent</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Fundamental analysis powered by SEC EDGAR filings, Finnhub market data, and a Guided ReAct reasoning engine.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className={`glass-card p-1.5 transition-all duration-300 ${isFocused ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10' : ''}`}>
            <input
              id="ticker-input"
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter the Company Name"
              autoComplete="off"
              className="w-full bg-transparent border-none rounded-xl px-4 py-3.5
                         font-mono text-lg tracking-widest text-white
                         placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          {/* <div className="glass-card p-1.5">
            <input
              id="query-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Optional: ask something specific…"
              className="w-full bg-transparent border-none rounded-xl px-4 py-2.5
                         text-sm text-slate-300 placeholder:text-slate-600
                         focus:outline-none"
            />
          </div> */}

          <button
            id="analyze-button"
            type="submit"
            disabled={!ticker.trim()}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:from-indigo-600 disabled:hover:to-indigo-500
                       disabled:shadow-none"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Analyze
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </form>

        {/* Quick picks */}
        <div className="space-y-3">
          <div className="text-center text-xs text-slate-600 uppercase tracking-wider">Popular tickers</div>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_TICKERS.map(t => (
              <button
                key={t}
                id={`quick-pick-${t}`}
                onClick={() => handleQuickSelect(t)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40
                           text-xs font-mono text-slate-400 hover:text-indigo-400
                           hover:border-indigo-500/30 hover:bg-indigo-500/5
                           transition-all duration-200"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Footer badges */}
        <div className="flex justify-center gap-6 pt-4">
          {["SEC EDGAR", "Finnhub", "ReAct Agent"].map(label => (
            <span key={label} className="text-[10px] uppercase tracking-widest text-slate-700 font-medium">
              {label}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
