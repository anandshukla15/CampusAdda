export default function ToastStack({ toasts }) {
  if (!toasts?.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:w-96">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-3xl border px-4 py-4 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 ${
            toast.variant === "success"
              ? "border-emerald-200/80 bg-emerald-50/95 text-emerald-950 shadow-emerald-900/10"
              : toast.variant === "error"
                ? "border-rose-200/80 bg-rose-50/95 text-rose-950 shadow-rose-900/10"
                : "border-slate-200 bg-white/95 text-slate-900 shadow-slate-900/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold sm:text-base">{toast.title}</p>
              {toast.message && <p className="mt-1 text-sm leading-6 opacity-90">{toast.message}</p>}
            </div>
            <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${toast.variant === "success" ? "bg-emerald-500" : toast.variant === "error" ? "bg-rose-500" : "bg-slate-400"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}