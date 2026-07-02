export default function ToastStack({ toasts }) {
  if (!toasts?.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[280px] max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${
            toast.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : toast.variant === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
        </div>
      ))}
    </div>
  );
}