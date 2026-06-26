import { useState } from "react";

const TYPE_CONFIG = {
  thought:      { icon: "💭", label: "Thought",      labelColor: "text-slate-500" },
  action:       { icon: "→",  label: "Action",       labelColor: "text-indigo-500" },
  observation:  { icon: "↩",  label: "Observation",  labelColor: "text-emerald-500" },
  final_answer: { icon: "⚡", label: "Final Answer", labelColor: "text-amber-500" },
};

export default function ThinkingStream({ events }) {
  const [open, setOpen] = useState(false);
  const steps = events.filter(e =>
    ["thought", "action", "observation", "final_answer"].includes(e.type)
  );

  return (
    <div className="glass-card overflow-hidden">
      <button
        id="toggle-reasoning"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-800/30 transition-all duration-200"
      >
        <span className="flex items-center gap-2.5">
          Agent trace
        </span>
        <svg className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-800/60 max-h-[28rem] overflow-y-auto divide-y divide-slate-800/40">
          {steps.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-600">Waiting for agent…</div>
          ) : steps.map((e, i) => {
            const cfg = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.thought;
            return (
              <div key={i} className="px-5 py-3.5 text-xs font-mono hover:bg-slate-800/20 transition-colors">
                <div className={`${cfg.labelColor} mb-1.5 flex items-center gap-1.5 font-semibold`}>
                  <span>{cfg.icon}</span>
                  {e.type === "thought" ? cfg.label : e.type === "action" || e.type === "observation" ? e.tool : cfg.label}
                </div>
                {e.type === "thought" && <p className="text-slate-400 leading-relaxed font-sans">{e.content}</p>}
                {e.type === "action" && <pre className="text-slate-500 overflow-x-auto text-[11px] bg-slate-800/40 rounded-lg p-2 mt-1">{JSON.stringify(e.input, null, 2)}</pre>}
                {e.type === "observation" && <p className="text-slate-500 font-sans break-all">{typeof e.content === "object" ? JSON.stringify(e.content).slice(0, 200) + "…" : e.content}</p>}
                {e.type === "final_answer" && <p className="text-slate-300 font-sans text-sm whitespace-pre-wrap">{e.content}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
