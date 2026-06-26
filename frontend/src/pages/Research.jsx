import { useEffect, useReducer, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { streamResearch } from "../lib/sseClient";
import VerdictCard from "../components/VerdictCard";
import ScoreBreakdown from "../components/ScoreBreakdown";
import CompanyNews from "../components/CompanyNews";
import ThinkingStream from "../components/ThinkingStream";

function reducer(state, action) {
  switch (action.type) {
    case "ADD_EVENT": return { ...state, events: [...state.events, action.payload] };
    case "SET_SCORE":  return { ...state, score: action.payload };
    case "SET_DONE":   return { ...state, done: true };
    case "SET_SECTOR": return { ...state, sector: action.payload };
    case "SET_ERROR":  return { ...state, error: action.payload, done: true };
    case "SET_FINAL_REASONING": return { ...state, final_reasoning: action.payload, sessionId: action.sessionId, ttsReady: false };
    case "SET_TTS_READY": return { ...state, ttsReady: true };
    default:           return state;
  }
}

export default function Research() {
  const { ticker } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") ?? "Full fundamental analysis";

  const [state, dispatch] = useReducer(reducer, {
    events: [], score: null, done: false, sector: null, error: null, final_reasoning: null, sessionId: null, ttsReady: false
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const audioRef = useRef(null);

  const handlePlayAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    
    try {
      setIsPlaying(true);
      if (!state.sessionId) throw new Error("No session ID found for TTS");
      const res = await fetch(`http://localhost:8000/api/tts/${state.sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch audio");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return streamResearch(ticker, query, (event) => {
      if (event.type === "score") {
        dispatch({ type: "SET_SCORE",  payload: event });
        dispatch({ type: "SET_SECTOR", payload: event.sector });
      } else if (event.type === "done") {
        dispatch({ type: "SET_DONE" });
      } else if (event.type === "final_reasoning") {
        dispatch({ type: "SET_FINAL_REASONING", payload: event.content, sessionId: event.sessionId });
      } else if (event.type === "tts_ready") {
        dispatch({ type: "SET_TTS_READY" });
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

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 relative z-10">
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
            <span className="font-mono text-2xl font-semibold text-white tracking-wide">{ticker}</span>
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
            <VerdictCard score={state.score} loading={!state.score} />

            {/* 2. Score breakdown bars */}
            {state.score && (
              <div className="animate-slide-up">
                <ScoreBreakdown breakdown={state.score.breakdown} />
                <CompanyNews news={state.score.news} />
              </div>
            )}

            {/* 4. Agent trace — collapsed by default */}
            <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <ThinkingStream events={state.events} />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* 3. Agent Reasoning */}
            {state.final_reasoning && (
              <div className="animate-slide-up h-full" style={{ animationDelay: "100ms" }}>
                <div className="glass-card p-6 border-indigo-500/20 shadow-lg shadow-indigo-500/5 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Agent Reasoning</h3>
                    </div>
                    <button
                      onClick={handlePlayAudio}
                      disabled={!state.ttsReady}
                      className="p-1.5 rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 flex items-center gap-2 px-3 text-xs"
                      title={!state.ttsReady ? "Preparing audio..." : isPlaying ? "Pause analysis" : "Listen to analysis"}
                    >
                      {!state.ttsReady ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Preparing audio...
                        </>
                      ) : isPlaying ? (
                        <>
                          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Pause
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Listen to Analysis
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {state.final_reasoning}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
