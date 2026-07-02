import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import ToastStack from "../components/ui/ToastStack";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "profile", label: "Profile" },
  { key: "saved", label: "Saved Events" },
  { key: "registered", label: "Registered Events" },
  { key: "notifications", label: "Notifications" },
  { key: "settings", label: "Settings" }
];

export default function Profile() {
  const user = getUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [savedEvents, setSavedEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [toasts, setToasts] = useState([]);

  const pushToast = (title, message, variant = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000);
  };

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const [profileResponse, savedResponse, registrationsResponse, notificationsResponse] = await Promise.all([
          API.get("/users/profile"),
          API.get("/events/saved/all"),
          API.get("/registrations/my"),
          API.get("/notifications")
        ]);

        setProfile(profileResponse.data || null);
        setSavedEvents(savedResponse.data || []);
        setRegistrations(registrationsResponse.data || []);
        setNotifications(notificationsResponse.data || []);
      } catch (error) {
        pushToast("Load failed", error?.response?.data?.error || "Unable to load your dashboard.", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, navigate]);

  const dashboardCards = useMemo(
    () => [
      { label: "Total Registered Events", value: registrations.filter((item) => item.status === "registered").length },
      { label: "Upcoming Events", value: registrations.filter((item) => item.status === "registered").length },
      { label: "Completed Events", value: registrations.filter((item) => item.status === "completed").length },
      { label: "Saved Events", value: savedEvents.length }
    ],
    [registrations, savedEvents.length]
  );

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <ToastStack toasts={toasts} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <DashboardSidebar
          title={profile?.name || "My Dashboard"}
          subtitle={profile?.college_name || profile?.role || "Campus Adda"}
          items={sidebarItems}
          activeKey={activeSection}
          onSelect={(key) => {
            if (key === "saved") return navigate("/saved");
            if (key === "registered") return navigate("/registered");
            setActiveSection(key);
          }}
          footer={<p className="text-sm text-slate-300">{profile?.email}</p>}
        />

        <main className="space-y-6">
          <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">User dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome, {profile?.name || user?.name || "Student"}</h1>
            <p className="mt-2 text-sm text-slate-300">Track saved events, registration history, and notifications from one place.</p>
          </header>

          {activeSection === "dashboard" && (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map((card) => (
                <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
                </div>
              ))}
            </section>
          )}

          {activeSection === "profile" && profile && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Profile</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Name</p><p className="mt-1 font-semibold text-slate-950">{profile.name}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Email</p><p className="mt-1 font-semibold text-slate-950">{profile.email}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Role</p><p className="mt-1 font-semibold text-slate-950 capitalize">{profile.role}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">College</p><p className="mt-1 font-semibold text-slate-950">{profile.college_name || "Not assigned"}</p></div>
              </div>
            </section>
          )}

          {activeSection === "saved" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">Saved Events</h2>
                <button onClick={() => navigate("/saved")} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Open saved events</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savedEvents.slice(0, 3).map((event) => (
                  <article key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{event.category}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{event.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{event.location || event.creator_college_name || "Not specified"}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeSection === "registered" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">Registered Events</h2>
                <button onClick={() => navigate("/registered")} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Open registrations</button>
              </div>
              <div className="space-y-3">
                {registrations.slice(0, 4).map((registration) => (
                  <article key={registration.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">{registration.activity_name}</h3>
                        <p className="text-sm text-slate-500">{registration.event_name}</p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{registration.registration_id}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeSection === "notifications" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Notifications</h2>
              <div className="mt-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No notifications yet.</p>
                ) : notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-950">{notification.message}</p>
                    <p className="mt-1 text-sm text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "settings" && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Settings</h2>
              <p className="mt-2 text-sm text-slate-600">Update your account preferences from the profile page when additional settings are enabled.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
