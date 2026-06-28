const GRADE_CONFIG = {
  "A+": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/10", signal: "Invest" },
  "A":  { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/10", signal: "Invest" },
  "B+": { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   glow: "shadow-amber-500/10",   signal: "Invest" },
  "B":  { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   glow: "shadow-amber-500/10",   signal: "Invest" },
  "C+": { color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  glow: "shadow-orange-500/10",  signal: "Pass" },
  "C":  { color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  glow: "shadow-orange-500/10",  signal: "Pass" },
  "D":  { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     glow: "shadow-red-500/10",     signal: "Pass" },
};

export default function VerdictCard({ score, loading }) {
  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-slate-800/80 shimmer-loading" />
          <div className="flex-1 space-y-3">
            <div className="h-3 bg-slate-800/80 rounded-full w-28 shimmer-loading" />
            <div className="h-3 bg-slate-800/80 rounded-full w-56 shimmer-loading" />
          </div>
        </div>
      </div>
    );
  }

  const config = GRADE_CONFIG[score.grade] ?? GRADE_CONFIG["D"];

  return (
    <div className={`glass-card p-6 ${config.border} animate-scale-in shadow-lg ${config.glow}`}>
      <div className="flex items-center gap-6">
        {/* Grade badge */}
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${config.bg} ${config.border} border
                         flex flex-col items-center justify-center`}>
          <div className={`text-2xl font-bold ${config.color} leading-none`}>
            {score.grade}
          </div>
          <div className="text-[9px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
            {score.composite_score}
          </div>
        </div>

        {/* Verdict */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${config.color} flex items-center gap-2 mb-1.5`}>
            {config.signal}
            <span className="text-[10px] text-slate-600 font-normal">
              · {score.composite_score}/100
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {score.verdict}
          </p>
        </div>
      </div>
    </div>
  );
}
