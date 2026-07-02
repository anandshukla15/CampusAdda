export default function DashboardSidebar({ title, subtitle, items, activeKey, onSelect, footer }) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-900/20">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Campus Adda</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-slate-300">{subtitle}</p>}
      </div>

      <nav className="space-y-1 p-3">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
              activeKey === item.key
                ? "bg-cyan-400 text-slate-950"
                : "text-slate-200 hover:bg-white/10"
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

      {footer && <div className="border-t border-white/10 px-5 py-4">{footer}</div>}
    </aside>
  );
}