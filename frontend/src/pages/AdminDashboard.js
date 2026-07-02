import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import ToastStack from "../components/ui/ToastStack";

const sidebarItems = [
  { key: "overview", label: "Dashboard" },
  { key: "registrations", label: "Registrations" },
  { key: "applications", label: "President Applications" },
  { key: "presidents", label: "Presidents" },
  { key: "events", label: "Events" },
  { key: "analytics", label: "Analytics" }
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [presidents, setPresidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectComments, setRejectComments] = useState({});
  const [toasts, setToasts] = useState([]);

  const pushToast = (title, message, variant = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResponse, registrationsResponse, applicationsResponse, eventsResponse, presidentsResponse] = await Promise.all([
        API.get("/admin/dashboard"),
        API.get("/admin/registrations"),
        API.get("/president/applications/pending"),
        API.get("/events"),
        API.get("/president/all")
      ]);

      setSummary(summaryResponse.data || null);
      setRegistrations(registrationsResponse.data || []);
      setApplications(applicationsResponse.data || []);
      setEvents(eventsResponse.data || []);
      setPresidents(presidentsResponse.data || []);
    } catch (error) {
      pushToast("Load failed", error?.response?.data?.error || "Unable to load admin dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const approveApplication = async (applicationId, userName) => {
    try {
      await API.put(`/president/approve/${applicationId}`, { admin_comments: "Approved by admin" });
      pushToast("Application approved", `${userName} is now a president.`, "success");
      fetchAll();
    } catch (error) {
      pushToast("Approve failed", error?.response?.data?.error || "Failed to approve application.", "error");
    }
  };

  const rejectApplication = async (applicationId, userName) => {
    const comments = rejectComments[applicationId] || "Application rejected";
    try {
      await API.put(`/president/reject/${applicationId}`, { admin_comments: comments });
      pushToast("Application rejected", `${userName}'s application was rejected.`, "success");
      setRejectComments({ ...rejectComments, [applicationId]: "" });
      fetchAll();
    } catch (error) {
      pushToast("Reject failed", error?.response?.data?.error || "Failed to reject application.", "error");
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await API.delete(`/events/${eventId}`);
      pushToast("Event deleted", "Event deleted successfully.", "success");
      fetchAll();
    } catch (error) {
      pushToast("Delete failed", error?.response?.data?.error || "Failed to delete event.", "error");
    }
  };

  const removePresident = async (presidentId, presidentName) => {
    if (!window.confirm(`Remove ${presidentName} from the president role?`)) return;

    try {
      await API.put(`/president/${presidentId}/remove`);
      pushToast("President removed", `${presidentName} is now a regular user.`, "success");
      fetchAll();
    } catch (error) {
      pushToast("Remove failed", error?.response?.data?.error || "Failed to remove president.", "error");
    }
  };

  const deleteRegistration = async (registrationId) => {
    if (!window.confirm("Delete this registration?")) return;

    try {
      await API.delete(`/registrations/${registrationId}`);
      pushToast("Registration deleted", "The registration was removed.", "success");
      fetchAll();
    } catch (error) {
      pushToast("Delete failed", error?.response?.data?.error || "Failed to delete registration.", "error");
    }
  };

  const filteredRegistrations = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return registrations.filter((registration) => {
      const matchesSearch =
        !lowered ||
        [registration.student_name, registration.email, registration.college_name, registration.activity_name, registration.event_name, registration.registration_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lowered));

      const matchesCategory = categoryFilter === "all" || registration.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [registrations, search, categoryFilter, statusFilter]);

  const overviewCards = [
    { label: "Total Users", value: summary?.summary?.total_users || 0 },
    { label: "Total Presidents", value: summary?.summary?.total_presidents || 0 },
    { label: "Total Events", value: summary?.summary?.total_events || 0 },
    { label: "Total Activities", value: summary?.summary?.total_activities || 0 },
    { label: "Total Registrations", value: summary?.summary?.total_registrations || 0 },
    { label: "Upcoming Events", value: summary?.summary?.upcoming_events || 0 }
  ];

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <ToastStack toasts={toasts} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <DashboardSidebar
          title="Admin Dashboard"
          subtitle="Monitor registrations, events, and president approvals."
          items={sidebarItems}
          activeKey={activeSection}
          onSelect={setActiveSection}
          footer={<p className="text-sm text-slate-300">Full platform control</p>}
        />

        <main className="space-y-6">
          <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Platform operations</p>
            <h1 className="mt-2 text-3xl font-semibold">Campus Adda Admin</h1>
            <p className="mt-2 text-sm text-slate-300">Review registrations, manage presidents, and keep event operations under control.</p>
          </header>

          {activeSection === "overview" && (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {overviewCards.map((card) => (
                <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
                </div>
              ))}
            </section>
          )}

          {activeSection === "registrations" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">All Registrations</h2>
                <div className="flex flex-wrap gap-3">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search registrations" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                    <option value="all">All Categories</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="tech">Tech</option>
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                    <option value="all">All Status</option>
                    <option value="registered">Registered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Activity</th>
                      <th className="px-4 py-3 text-left">Fest</th>
                      <th className="px-4 py-3 text-left">Registration ID</th>
                      <th className="px-4 py-3 text-left">Payment</th>
                      <th className="px-4 py-3 text-left">Attendance</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredRegistrations.length === 0 ? (
                      <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">No registrations found.</td></tr>
                    ) : filteredRegistrations.map((registration) => (
                      <tr key={registration.id}>
                        <td className="px-4 py-3 font-medium text-slate-950">{registration.student_name}</td>
                        <td className="px-4 py-3 text-slate-600">{registration.activity_name}</td>
                        <td className="px-4 py-3 text-slate-600">{registration.event_name}</td>
                        <td className="px-4 py-3 text-slate-600">{registration.registration_id}</td>
                        <td className="px-4 py-3 text-slate-600">{registration.payment_status}</td>
                        <td className="px-4 py-3 text-slate-600">{registration.attendance_status}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteRegistration(registration.id)} className="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === "applications" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">President Applications</h2>
              <div className="mt-4 space-y-4">
                {applications.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No pending applications.</p>
                ) : applications.map((application) => (
                  <div key={application.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><p className="text-sm text-slate-500">Name</p><p className="font-semibold">{application.name}</p></div>
                      <div><p className="text-sm text-slate-500">Email</p><p className="font-semibold">{application.email}</p></div>
                      <div><p className="text-sm text-slate-500">Roll Number</p><p className="font-semibold">{application.roll_no}</p></div>
                      <div><p className="text-sm text-slate-500">College</p><p className="font-semibold">{application.college_name}</p></div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => approveApplication(application.id, application.name)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Approve</button>
                      <input value={rejectComments[application.id] || ""} onChange={(e) => setRejectComments({ ...rejectComments, [application.id]: e.target.value })} placeholder="Rejection reason (optional)" className="min-w-[220px] flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm" />
                      <button onClick={() => rejectApplication(application.id, application.name)} className="rounded-2xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "presidents" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Current Presidents</h2>
              <div className="mt-4 space-y-4">
                {presidents.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No active presidents.</p>
                ) : presidents.map((president) => (
                  <div key={president.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div><p className="text-sm text-slate-500">Name</p><p className="font-semibold">{president.name}</p></div>
                      <div><p className="text-sm text-slate-500">Email</p><p className="font-semibold">{president.email}</p></div>
                      <div><p className="text-sm text-slate-500">College</p><p className="font-semibold">{president.college_name}</p></div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-slate-500">Appointed on</p>
                      <p className="text-sm text-slate-700">{new Date(president.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => removePresident(president.id, president.name)} className="mt-4 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                      Remove President
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "events" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">All Events</h2>
              <div className="mt-4 space-y-4">
                {events.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No events created.</p>
                ) : events.map((event) => (
                  <div key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div><p className="text-sm text-slate-500">Event Name</p><p className="font-semibold">{event.name}</p></div>
                      <div><p className="text-sm text-slate-500">Category</p><p className="font-semibold capitalize">{event.category}</p></div>
                      <div><p className="text-sm text-slate-500">Activities</p><p className="font-semibold">{event.activities?.length || 0}</p></div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => deleteEvent(event.id)} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete Event</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "analytics" && (
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Most Registered Activities</h2>
                <div className="mt-4 space-y-3">
                  {(summary?.mostRegisteredActivities || []).map((activity) => (
                    <div key={activity.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-950">{activity.activity_name}</p>
                        <span className="text-sm text-slate-500">{activity.total_registrations}</span>
                      </div>
                      <p className="text-sm text-slate-500">{activity.event_name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Popular Colleges</h2>
                <div className="mt-4 space-y-3">
                  {(summary?.mostPopularColleges || []).map((college) => (
                    <div key={college.college_name} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-950">{college.college_name}</p>
                        <span className="text-sm text-slate-500">{college.total_registrations}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
