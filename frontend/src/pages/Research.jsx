import { useEffect, useReducer, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { streamResearch } from "../lib/sseClient";
import { API_BASE } from "../lib/config";
import VerdictCard from "../components/VerdictCard";
import ScoreBreakdown from "../components/ScoreBreakdown";
import CompanyNews from "../components/CompanyNews";
import ThinkingStream from "../components/ThinkingStream";
import ChatAssistant from "../components/ChatAssistant";

function reducer(state, action) {
  switch (action.type) {
    case "ADD_EVENT": return { ...state, events: [...state.events, action.payload] };
    case "SET_SCORE":  return { ...state, score: action.payload };
    case "SET_DONE":   return { ...state, done: true };
    case "SET_SECTOR": return { ...state, sector: action.payload };
    case "SET_ERROR":  return { ...state, error: action.payload, done: true };
    case "SET_FINAL_REASONING": return { ...state, final_reasoning: action.payload, sessionId: action.sessionId };
    case "SET_COMPANY_INFO": return { ...state, companyName: action.companyName, resolvedTicker: action.resolvedTicker };
    default:           return state;
  }
}

export default function Research() {
  const { ticker } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") ?? "Full fundamental analysis";

  const [state, dispatch] = useReducer(reducer, {
    events: [], score: null, done: false, sector: null, error: null, final_reasoning: null, sessionId: null, companyName: null, resolvedTicker: null
  });

  useEffect(() => {
    return streamResearch(ticker, query, (event) => {
      if (event.type === "score") {
        dispatch({ type: "SET_SCORE",  payload: event });
        dispatch({ type: "SET_SECTOR", payload: event.sector });
      } else if (event.type === "done") {
        dispatch({ type: "SET_DONE" });
      } else if (event.type === "final_reasoning") {
        dispatch({ type: "SET_FINAL_REASONING", payload: event.content, sessionId: event.sessionId });
      } else if (event.type === "research_complete") {
        dispatch({ type: "SET_COMPANY_INFO", companyName: event.data?.company, resolvedTicker: event.data?.ticker });
      } else if (event.type === "error") {
        dispatch({ type: "SET_ERROR", payload: event.message });
      } else {
        if (event.type === "observation" && event.content?.sector)
          dispatch({ type: "SET_SECTOR", payload: event.content.sector });
        dispatch({ type: "ADD_EVENT", payload: event });
      }
    });
  }, [ticker, query]);

  const stepCount = state.events.filter(e => e.type === "thought").length;

  return (
    <main className="min-h-screen relative">
      {/* Ambient backgrounds */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 pb-32 relative z-10">
        {/* Back button */}
        <button
          id="back-button"
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-8 group"
        >
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          New search
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-semibold text-white tracking-wide">{state.companyName || ticker}</span>
            {state.resolvedTicker && state.resolvedTicker !== (state.companyName || ticker) && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full
                             bg-slate-700/50 text-slate-400 border border-slate-600/30 font-mono">
                {state.resolvedTicker}
              </span>
            )}
            {state.sector && (
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full
                             bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                {state.sector}
              </span>
            )}
            {state.score?.marketCap && (
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full
                             bg-slate-500/10 text-slate-400 border border-slate-500/20 font-medium">
                Cap: ${(state.score.marketCap >= 1e6 ? (state.score.marketCap / 1e6).toFixed(2) + 'T' : state.score.marketCap >= 1e3 ? (state.score.marketCap / 1e3).toFixed(2) + 'B' : state.score.marketCap.toFixed(2) + 'M')}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {state.done ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Complete
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                Researching{stepCount > 0 ? ` · Step ${stepCount}` : ""}…
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {state.error && (
          <div className="glass-card p-4 mb-4 border-red-500/30 animate-slide-up">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {state.error}
            </div>
          </div>
        )}

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Verdict card — the hero */}
            {!state.error && <VerdictCard score={state.score} loading={!state.score} />}

            {/* 2. Score breakdown bars */}
            {state.score && (
              <div className="animate-slide-up">
                <ScoreBreakdown breakdown={state.score.breakdown} />
                <CompanyNews news={state.score.news} />
              </div>
            )}

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* 3. Agent Reasoning */}
            {state.final_reasoning && (
              <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                <div className="glass-card p-6 border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Agent Reasoning</h3>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {state.final_reasoning}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Agent trace — collapsed by default */}
            {!state.error && (
              <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                <ThinkingStream events={state.events} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Context-aware Chat Assistant */}
      {state.sessionId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4 animate-slide-up" style={{ animationDelay: "150ms" }}>
          <ChatAssistant sessionId={state.sessionId} />
        </div>
      )}
    </main>
  );
}
