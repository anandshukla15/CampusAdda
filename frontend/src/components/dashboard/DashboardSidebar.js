export default function DashboardSidebar({ title, subtitle, items, activeKey, onSelect, footer }) {
  return (
    <aside className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-900/20 lg:sticky lg:top-6">
      <div className="border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Campus Adda</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>}
      </div>

      <nav className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-1">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition duration-200 ${
              activeKey === item.key
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "text-slate-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="font-medium">{item.label}</span>
            {item.badge != null && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${activeKey === item.key ? "bg-slate-950/10" : "bg-white/10"}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {footer && <div className="border-t border-white/10 px-5 py-4 text-sm text-slate-300">{footer}</div>}
    </aside>
  );
}