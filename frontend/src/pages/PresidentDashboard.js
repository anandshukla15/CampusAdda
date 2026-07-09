import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";
import socket from "../services/socket";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import ToastStack from "../components/ui/ToastStack";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "my-events", label: "My Events" },
  { key: "participants", label: "Participants" },
  { key: "notifications", label: "Notifications" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" }
];

const emptyActivity = {
  activity_name: "",
  activity_description: "",
  venue: "",
  event_date: "",
  start_time: "",
  registration_link: "",
  max_participants: ""
};

const formatActivityForForm = (activity) => ({
  activity_name: activity.activity_name || "",
  activity_description: activity.activity_description || "",
  venue: activity.venue || "",
  event_date: activity.event_date?.split("T")[0] || activity.event_date || "",
  start_time: activity.start_time?.slice(0, 5) || "",
  registration_link: activity.registration_link || "",
  max_participants: activity.max_participants || ""
});

export default function PresidentDashboard() {
  const user = getUser();
  const userId = user?.id;
  const userRole = user?.role;
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({ summary: {}, events: [], activities: [] });
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantStatus, setParticipantStatus] = useState("all");
  const [participantPayment, setParticipantPayment] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [eventForm, setEventForm] = useState(null);

  const pushToast = (title, message, variant = "info") => {
    const toastId = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id: toastId, title, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== toastId)), 3000);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await API.get("/president/dashboard");
      setDashboardData(response.data || { summary: {}, events: [], activities: [] });
      if (!selectedActivityId && response.data?.activities?.length) {
        setSelectedActivityId(response.data.activities[0].id);
      }
    } catch (error) {
      pushToast("Dashboard load failed", error?.response?.data?.error || "Unable to load president dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedActivityId]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await API.get("/notifications");
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  }, []);

  const dismissNotification = async (notificationId) => {
    try {
      await API.post(`/notifications/mark-read/${notificationId}`);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    } catch (error) {
      pushToast("Dismiss failed", error?.response?.data?.error || "Unable to dismiss the notification.", "error");
    }
  };

  const fetchParticipants = useCallback(async (activityId) => {
    if (!activityId) {
      setParticipants([]);
      return;
    }

    try {
      const response = await API.get(`/president/participants/${activityId}`);
      setParticipants(response.data?.participants || []);
    } catch (error) {
      pushToast("Participants load failed", error?.response?.data?.error || "Unable to load participants.", "error");
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    if (userRole !== "president") {
      API.get(`/president/status/${userId}`)
        .then((response) => setApplicationStatus(response.data))
        .catch((error) => console.error(error))
        .finally(() => setLoading(false));
      return;
    }

    fetchDashboard();
    fetchNotifications();
  }, [userId, userRole, navigate, fetchDashboard, fetchNotifications]);

  useEffect(() => {
    if (userRole !== "president") return;
    fetchParticipants(selectedActivityId);
  }, [selectedActivityId, userRole, fetchParticipants]);

  useEffect(() => {
    const handleNotification = (payload) => {
      if (payload?.type === "new_event") {
        pushToast("New event added", payload.message || "A new event was created.", "info");
        fetchNotifications();
      }

      if (payload?.type === "participant_registered") {
        pushToast("New registration", payload.message || "A new student registered for your activity.", "success");
        fetchDashboard();
        fetchParticipants(selectedActivityId);
        fetchNotifications();
      }
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [fetchDashboard, fetchNotifications, fetchParticipants, selectedActivityId]);

  const selectedActivity = useMemo(
    () => dashboardData.activities.find((activity) => activity.id === selectedActivityId),
    [dashboardData.activities, selectedActivityId]
  );

  const filteredParticipants = useMemo(() => {
    const lowered = participantSearch.trim().toLowerCase();
    return participants.filter((participant) => {
      const matchesSearch =
        !lowered ||
        [participant.student_name, participant.email, participant.college_name, participant.registration_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(lowered));

      const matchesStatus = participantStatus === "all" || participant.attendance_status === participantStatus || participant.status === participantStatus;
      const matchesPayment = participantPayment === "all" || participant.payment_status === participantPayment;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [participants, participantSearch, participantStatus, participantPayment]);

  const exportParticipants = (format) => {
    if (!filteredParticipants.length) return;

    const headers = ["Student Name", "Email", "College", "Registration ID", "Registration Date", "Attendance Status", "Payment Status"];
    const rows = filteredParticipants.map((participant) => [
      participant.student_name,
      participant.email,
      participant.college_name,
      participant.registration_id,
      participant.registered_at,
      participant.attendance_status,
      participant.payment_status
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: format === "excel" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `participants.${format === "excel" ? "xls" : "csv"}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleRegistrations = async () => {
    if (!confirmToggle) return;

    try {
      await API.patch(`/event-activities/${confirmToggle.id}/registration-status`, {
        registration_open: !confirmToggle.registration_open
      });
      pushToast(
        "Registration updated",
        confirmToggle.registration_open ? "Registrations closed for this activity." : "Registrations reopened for this activity.",
        "success"
      );
      setConfirmToggle(null);
      fetchDashboard();
      fetchParticipants(selectedActivityId);
    } catch (error) {
      pushToast("Update failed", error?.response?.data?.error || "Unable to update registration state.", "error");
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await API.delete(`/events/${eventId}`);
      pushToast("Event deleted", "The event was deleted successfully.", "success");
      fetchDashboard();
    } catch (error) {
      pushToast("Delete failed", error?.response?.data?.error || "Failed to delete event.", "error");
    }
  };

  useEffect(() => {
    if (editingEvent) {
      setEventForm({
        name: editingEvent.name,
        category: editingEvent.category,
        description: editingEvent.description || "",
        location: editingEvent.location || "",
        link: editingEvent.link || "",
        photo_url: editingEvent.photo_url || "",
        activities: editingEvent.activities?.length
          ? editingEvent.activities.map(formatActivityForForm)
          : [{ ...emptyActivity }]
      });
      setShowCreateForm(true);
    }
  }, [editingEvent]);

  if (userRole !== "president") {
    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
      <div className="mx-auto mt-12 max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-semibold">President Application</h2>

        {applicationStatus?.status === "pending" && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-800">Application Pending</p>
            <p className="mt-2 text-sm text-amber-700">Your application was submitted on {new Date(applicationStatus.submitted_at).toLocaleDateString()}. Please wait for admin approval.</p>
          </div>
        )}

        {applicationStatus?.status === "approved" && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800">Application Approved</p>
            <p className="mt-2 text-sm text-emerald-700">Refresh the page to access president features.</p>
            <button onClick={() => window.location.reload()} className="mt-3 rounded-2xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
              Refresh
            </button>
          </div>
        )}

        {applicationStatus?.status === "rejected" && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-rose-800">Application Rejected</p>
            {applicationStatus.admin_comments && <p className="mt-2 text-sm text-rose-700">Reason: {applicationStatus.admin_comments}</p>}
          </div>
        )}

        {applicationStatus?.status === "no_application" && (
          <PresidentApplicationForm
            onSuccess={() => {
              API.get(`/president/status/${userId}`).then((response) => setApplicationStatus(response.data));
            }}
          />
        )}
      </div>
    );
  }

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>;

  const totalEvents = dashboardData.summary?.total_events || 0;
  const totalActivities = dashboardData.summary?.total_activities || 0;
  const totalRegistrations = dashboardData.summary?.total_registrations || 0;
  const remainingSeats = dashboardData.summary?.remaining_seats || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <ToastStack toasts={toasts} />
      <ConfirmDialog
        open={Boolean(confirmToggle)}
        title={confirmToggle?.registration_open ? "Close registrations?" : "Reopen registrations?"}
        message={confirmToggle?.registration_open ? "New students will no longer be able to register for this activity." : "Students will be able to register again for this activity."}
        confirmLabel={confirmToggle?.registration_open ? "Close Registrations" : "Reopen Registrations"}
        onCancel={() => setConfirmToggle(null)}
        onConfirm={toggleRegistrations}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <DashboardSidebar
          title="President Dashboard"
          subtitle="Manage events, participants, and registration controls."
          items={sidebarItems}
          activeKey={activeSection}
          onSelect={setActiveSection}
          footer={<p className="text-sm text-slate-300">{user?.name || "President"}</p>}
        />

        <main className="space-y-6">
          <header className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Participation control</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-950">Hello {user?.name || "President"}</h1>
                <p className="mt-2 text-sm text-slate-600">Monitor registrations, export participant lists, and keep activity seats under control.</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateForm((prev) => !prev);
                  setEditingEvent(null);
                  setEventForm(null);
                }}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {showCreateForm ? "Cancel" : "+ Create New Event"}
              </button>
            </div>
          </header>

          {activeSection === "dashboard" && (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Events", value: totalEvents },
                { label: "Total Activities", value: totalActivities },
                { label: "Total Registrations", value: totalRegistrations },
                { label: "Remaining Seats", value: remainingSeats }
              ].map((card) => (
                <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
                </div>
              ))}
            </section>
          )}

          {showCreateForm && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-950">{editingEvent ? "Edit Event" : "Create New Event"}</h3>
              <EventForm
                event={editingEvent}
                initialValue={eventForm}
                onSuccess={() => {
                  setShowCreateForm(false);
                  setEditingEvent(null);
                  setEventForm(null);
                  fetchDashboard();
                }}
              />
            </section>
          )}

          {activeSection === "my-events" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-slate-950">My Events ({dashboardData.events.length})</h3>
                <p className="text-sm text-slate-500">Use the activity panel to open or close registrations.</p>
              </div>

              {dashboardData.events.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No events created yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {dashboardData.events.map((event) => (
                    <article key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <h4 className="text-lg font-semibold text-slate-950">{event.name}</h4>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p><strong className="text-slate-900">Category:</strong> {event.category}</p>
                        <p><strong className="text-slate-900">Location:</strong> {event.location || event.creator_college_name || "Not specified"}</p>
                        <p><strong className="text-slate-900">Activities:</strong> {event.activities?.length || 0}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => setEditingEvent(event)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                          Edit
                        </button>
                        <button onClick={() => deleteEvent(event.id)} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeSection === "participants" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">Participants</h3>
                  <p className="text-sm text-slate-500">Select an activity to inspect its registrations.</p>
                </div>
                <select
                  value={selectedActivityId || ""}
                  onChange={(e) => setSelectedActivityId(Number(e.target.value) || null)}
                  className="min-w-[260px] rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Select activity</option>
                  {dashboardData.activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.activity_name} - {activity.event_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedActivity ? (
                <>
                  <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Activity</p><p className="mt-2 font-semibold text-slate-950">{selectedActivity.activity_name}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Registered</p><p className="mt-2 font-semibold text-slate-950">{selectedActivity.registration_count || 0}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Remaining Seats</p><p className="mt-2 font-semibold text-slate-950">{selectedActivity.max_participants ? Math.max(Number(selectedActivity.max_participants) - (selectedActivity.registration_count || 0), 0) : "Unlimited"}</p></div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-3">
                    <input
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      placeholder="Search participants"
                      className="min-w-[240px] rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    />
                    <select value={participantStatus} onChange={(e) => setParticipantStatus(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                      <option value="all">All Attendance</option>
                      <option value="pending">Pending</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                    <select value={participantPayment} onChange={(e) => setParticipantPayment(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                      <option value="all">All Payments</option>
                      <option value="free">Free</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                    <button onClick={() => exportParticipants("csv")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Export CSV</button>
                    <button onClick={() => exportParticipants("excel")} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export Excel</button>
                    <button
                      onClick={() => setConfirmToggle(selectedActivity)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white ${selectedActivity.registration_open ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                    >
                      {selectedActivity.registration_open ? "Close Registrations" : "Reopen Registrations"}
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-left">Student Name</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-left">College</th>
                          <th className="px-4 py-3 text-left">Registration ID</th>
                          <th className="px-4 py-3 text-left">Registration Date</th>
                          <th className="px-4 py-3 text-left">Attendance</th>
                          <th className="px-4 py-3 text-left">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredParticipants.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-slate-500">No participants found.</td>
                          </tr>
                        ) : filteredParticipants.map((participant) => (
                          <tr key={participant.id}>
                            <td className="px-4 py-3 font-medium text-slate-950">{participant.student_name}</td>
                            <td className="px-4 py-3 text-slate-600">{participant.email}</td>
                            <td className="px-4 py-3 text-slate-600">{participant.college_name || "Not specified"}</td>
                            <td className="px-4 py-3 text-slate-600">{participant.registration_id}</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(participant.registered_at).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-600">{participant.attendance_status}</td>
                            <td className="px-4 py-3 text-slate-600">{participant.payment_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Pick an activity to load participants.</p>
              )}
            </section>
          )}

          {activeSection === "notifications" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-slate-950">Notifications</h3>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No notifications yet.</p>
                ) : notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => dismissNotification(notification.id)}
                    className={`cursor-pointer rounded-2xl border p-4 ${notification.is_read ? "border-slate-200 bg-white" : "border-cyan-200 bg-cyan-50 hover:bg-cyan-100"}`}
                  >
                    <p className="font-semibold text-slate-950">{notification.message}</p>
                    <p className="mt-1 text-sm text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "analytics" && (
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">Activities Overview</h3>
                <div className="mt-4 space-y-3">
                  {dashboardData.activities.map((activity) => (
                    <div key={activity.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-950">{activity.activity_name}</p>
                        <span className="text-sm text-slate-500">{activity.registration_count || 0} registrations</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-cyan-400"
                          style={{ width: `${Math.min(((activity.registration_count || 0) / Math.max(activity.max_participants || 1, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-950">Quick Analytics</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Total Events", value: totalEvents },
                    { label: "Total Activities", value: totalActivities },
                    { label: "Total Registrations", value: totalRegistrations },
                    { label: "Remaining Seats", value: remainingSeats }
                  ].map((card) => (
                    <div key={card.label} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSection === "settings" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">Settings</h3>
              <p className="mt-2 text-sm text-slate-600">Registration controls, email notifications, and export settings can be configured here later without changing the participant workflow.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function PresidentApplicationForm({ onSuccess }) {
  const user = getUser();
  const [form, setForm] = useState({
    name: user?.name || "",
    roll_no: "",
    college_name: "",
    document_url: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.roll_no || !form.college_name) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      await API.post(`/api/president/apply/${user.id}`, form);
      onSuccess();
    } catch (submissionError) {
      setError(submissionError?.response?.data?.error || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">{error}</div>}
      {[
        { label: "Full Name", key: "name" },
        { label: "Roll Number", key: "roll_no" },
        { label: "College Name", key: "college_name" }
      ].map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
          <input
            type="text"
            value={form[field.key]}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>
      ))}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Document Link (Optional)</label>
        <input
          type="url"
          value={form.document_url}
          onChange={(e) => setForm({ ...form, document_url: e.target.value })}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
        />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-white hover:bg-slate-800 disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}

function EventForm({ event, initialValue, onSuccess }) {
  const [form, setForm] = useState(
    initialValue ||
      (event
        ? {
            name: event.name,
            category: event.category,
            description: event.description || "",
            location: event.location || "",
            link: event.link || "",
            photo_url: event.photo_url || "",
            activities: event.activities?.length ? event.activities.map(formatActivityForForm) : [{ ...emptyActivity }]
          }
        : {
            name: "",
            category: "cultural",
            description: "",
            location: "",
            link: "",
            photo_url: "",
            activities: [{ ...emptyActivity }]
          })
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) {
      setForm(initialValue);
      return;
    }

    if (event) {
      setForm({
        name: event.name,
        category: event.category,
        description: event.description || "",
        location: event.location || "",
        link: event.link || "",
        photo_url: event.photo_url || "",
        activities: event.activities?.length ? event.activities.map(formatActivityForForm) : [{ ...emptyActivity }]
      });
    }
  }, [initialValue, event]);

  const updateActivity = (index, activity) => {
    const nextActivities = [...form.activities];
    nextActivities[index] = activity;
    setForm({ ...form, activities: nextActivities });
  };

  const addActivity = () => setForm({ ...form, activities: [...form.activities, { ...emptyActivity }] });
  const removeActivity = (index) => setForm({ ...form, activities: form.activities.filter((_, activityIndex) => activityIndex !== index) });

  const handleSubmit = async (eventSubmit) => {
    eventSubmit.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.description || !form.location) {
      setError("Fest name, description, and location are required");
      setLoading(false);
      return;
    }

    const invalidActivity = form.activities.find((activity) => !activity.activity_name || !activity.activity_description || !activity.venue || !activity.event_date);
    if (invalidActivity) {
      setError("Each activity needs a name, description, venue, and date");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        activities: form.activities.map((activity) => ({
          ...activity,
          activity_type: form.category,
          start_time: activity.start_time || null,
          registration_link: activity.registration_link || null,
          max_participants: activity.max_participants || null
        }))
      };

      if (event) {
        await API.put(`/events/${event.id}`, payload);
      } else {
        await API.post("/events/create", payload);
      }

      onSuccess();
    } catch (submissionError) {
      setError(submissionError?.response?.data?.error || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">{error}</div>}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Fest Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
            <option value="cultural">Cultural</option>
            <option value="sports">Sports</option>
            <option value="tech">Tech</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="4" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Activities</p>
          <button type="button" onClick={addActivity} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Add Activity
          </button>
        </div>
        <div className="space-y-4">
          {form.activities.map((activity, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Activity Name" value={activity.activity_name} onChange={(e) => updateActivity(index, { ...activity, activity_name: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                <input placeholder="Venue" value={activity.venue} onChange={(e) => updateActivity(index, { ...activity, venue: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                <input type="date" value={activity.event_date} onChange={(e) => updateActivity(index, { ...activity, event_date: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                <input type="time" value={activity.start_time} onChange={(e) => updateActivity(index, { ...activity, start_time: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                <input placeholder="Max Participants" value={activity.max_participants} onChange={(e) => updateActivity(index, { ...activity, max_participants: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                <input placeholder="Registration Link" value={activity.registration_link} onChange={(e) => updateActivity(index, { ...activity, registration_link: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </div>
              <textarea placeholder="Activity Description" value={activity.activity_description} onChange={(e) => updateActivity(index, { ...activity, activity_description: e.target.value })} rows="3" className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => removeActivity(index)} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Event Link</label>
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Photo URL</label>
          <input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
        {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
}
