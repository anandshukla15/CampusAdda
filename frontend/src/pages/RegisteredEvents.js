import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastStack from "../components/ui/ToastStack";

const PAGE_SIZE = 6;

export default function RegisteredEvents() {
  const user = getUser();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const pushToast = (title, message, variant = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000);
  };

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/registrations/my");
      setRegistrations(res.data || []);
    } catch (error) {
      pushToast("Load failed", error?.response?.data?.error || "Unable to load registrations.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchRegistrations();
  }, [user?.id, fetchRegistrations]);

  const filteredRegistrations = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return registrations.filter((registration) => {
      const matchesQuery =
        !lowered ||
        [
          registration.activity_name,
          registration.event_name,
          registration.organizer_college_name,
          registration.venue,
          registration.registration_id
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lowered));

      const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [registrations, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / PAGE_SIZE));
  const paginatedRegistrations = filteredRegistrations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const handleCancel = async () => {
    if (!cancelTarget) return;

    try {
      setActionLoadingId(cancelTarget.id);
      await API.delete(`/registrations/${cancelTarget.id}`);
      pushToast("Registration cancelled", "Your registration has been cancelled.", "success");
      setCancelTarget(null);
      await fetchRegistrations();
    } catch (error) {
      pushToast("Cancel failed", error?.response?.data?.error || "Unable to cancel registration.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const exportData = (format) => {
    const headers = [
      "Registration ID",
      "Activity",
      "Fest",
      "College",
      "Venue",
      "Date",
      "Time",
      "Status",
      "Payment Status",
      "Attendance Status"
    ];

    const rows = filteredRegistrations.map((registration) => [
      registration.registration_id,
      registration.activity_name,
      registration.event_name,
      registration.organizer_college_name,
      registration.venue,
      registration.event_date,
      registration.start_time,
      registration.status,
      registration.payment_status,
      registration.attendance_status
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: format === "excel" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registered-events.${format === "excel" ? "xls" : "csv"}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <ToastStack toasts={toasts} />
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel registration?"
        message={`This will cancel ${cancelTarget?.activity_name || "this activity"}. You can register again only if the organizer reopens it.`}
        confirmLabel={actionLoadingId ? "Cancelling..." : "Cancel Registration"}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />

      <div className="mb-6 rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/20">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Participation Hub</p>
        <h1 className="mt-3 text-3xl font-semibold">Registered Events</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Track every activity you have registered for, review your registration status, and cancel upcoming entries when needed.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
          <div className="mt-4 space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activity, fest, college..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-950 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="registered">Registered</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <button onClick={() => exportData("csv")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Export CSV
            </button>
            <button onClick={() => exportData("excel")} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Export Excel
            </button>
          </div>
        </aside>

        <main className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Registered Events", value: registrations.filter((item) => item.status === "registered").length },
              { label: "Upcoming Events", value: registrations.filter((item) => item.status === "registered").length },
              { label: "Completed Events", value: registrations.filter((item) => item.status === "completed").length },
              { label: "Cancelled Events", value: registrations.filter((item) => item.status === "cancelled").length }
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading registrations...</div>
          ) : paginatedRegistrations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No registrations found.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {paginatedRegistrations.map((registration) => (
                <article key={registration.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{registration.event_name}</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">{registration.activity_name}</h2>
                    </div>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{registration.registration_id}</span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p><strong className="text-slate-900">College:</strong> {registration.organizer_college_name || "Campus Adda"}</p>
                    <p><strong className="text-slate-900">Venue:</strong> {registration.venue}</p>
                    <p><strong className="text-slate-900">Date:</strong> {new Date(registration.event_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    <p><strong className="text-slate-900">Time:</strong> {registration.start_time ? registration.start_time.slice(0, 5) : "Not specified"}</p>
                    <p><strong className="text-slate-900">Status:</strong> {registration.status}</p>
                    <p><strong className="text-slate-900">Payment:</strong> {registration.payment_status}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                      View Details
                    </button>
                    {registration.status === "registered" ? (
                      <button
                        onClick={() => setCancelTarget(registration)}
                        className="rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        ALL THE BEST
                      </button>
                    ) : (
                      <span className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-500">{registration.status}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                disabled={page === 1}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                disabled={page === totalPages}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
