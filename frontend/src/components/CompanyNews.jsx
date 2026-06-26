export default function CompanyNews({ news }) {
  if (!news || news.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6 mt-4 animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
        </svg>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Top News
        </h3>
      </div>
      
      <div className="space-y-4">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block group bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-sm">
                    {item.source}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.datetime * 1000).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors mb-2 line-clamp-2">
                  {item.headline}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.summary}
                </p>
              </div>
              {item.image && (
                <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-800">
                  <img src={item.image} alt={item.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
