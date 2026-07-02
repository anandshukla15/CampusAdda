import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";
import ToastStack from "../components/ui/ToastStack";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Not specified";

export default function EventDetails() {
  const { id } = useParams();
  const user = getUser();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [registeringActivityId, setRegisteringActivityId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const activities = event?.activities || [];

  const registrationsByActivity = useMemo(() => {
    return myRegistrations.reduce((acc, registration) => {
      acc[registration.activity_id] = registration;
      return acc;
    }, {});
  }, [myRegistrations]);

  const pushToast = (title, message, variant = "info") => {
    const toastId = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id: toastId, title, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toastId));
    }, 3000);
  };

  const refreshRegistrations = async () => {
    if (!user?.id) return;
    const response = await API.get("/registrations/my");
    setMyRegistrations(response.data || []);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await API.get(`/events/${id}`);
        if (!mounted) return;
        setEvent(res.data);

        if (user?.id) {
          try {
            const savedResponse = await API.get("/events/saved/all");
            const savedIds = savedResponse.data?.map((item) => item.id) || [];
            if (mounted) setIsSaved(savedIds.includes(Number(id)));
          } catch (error) {
            console.error("Failed to check saved status", error);
          }

          try {
            const registrationsResponse = await API.get("/registrations/my");
            if (mounted) setMyRegistrations(registrationsResponse.data || []);
          } catch (error) {
            console.error("Failed to load registrations", error);
          }
        }
      } catch (error) {
        console.error("Failed to load event", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, user?.id]);

  const handleSaveToggle = async () => {
    if (!user?.id) {
      pushToast("Login required", "Please log in to save events.", "error");
      return;
    }

    try {
      if (isSaved) {
        await API.delete(`/events/${id}/save`);
        pushToast("Saved events", "Event removed from your saved list.", "success");
      } else {
        await API.post(`/events/${id}/save`);
        pushToast("Saved events", "Event saved successfully.", "success");
      }
      setIsSaved((prev) => !prev);
    } catch (error) {
      pushToast("Save failed", error?.response?.data?.error || "Unable to update saved events.", "error");
    }
  };

  const handleRegister = async (activity) => {
    if (!user?.id) {
      pushToast("Login required", "Please log in to register for this activity.", "error");
      return;
    }

    const existingRegistration = registrationsByActivity[activity.id];
    if (existingRegistration?.status === "registered") {
      pushToast("Already registered", "You have already registered for this activity.", "info");
      return;
    }

    const closed = activity.registration_closed || activity.remaining_seats === 0;
    if (closed) {
      pushToast("Registration Closed", "This activity is no longer accepting registrations.", "error");
      return;
    }

    try {
      setRegisteringActivityId(activity.id);
      const response = await API.post("/registrations", { activity_id: activity.id });
      pushToast("Registration Successful", response.data?.message || "Your registration is confirmed.", "success");
      const eventResponse = await API.get(`/events/${id}`);
      await refreshRegistrations();
      setEvent(eventResponse.data);
    } catch (error) {
      pushToast("Registration failed", error?.response?.data?.error || "Unable to register for this activity.", "error");
    } finally {
      setRegisteringActivityId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!event) {
    return <div className="p-6 text-center text-gray-600">Event not found</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <ToastStack toasts={toasts} />

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[320px] bg-slate-950 text-white">
            {event.photo_url ? (
              <img
                src={event.photo_url}
                alt={event.name}
                className="h-full w-full object-cover opacity-80"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x400?text=Event";
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Campus Adda Fest</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight lg:text-5xl">{event.name}</h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-cyan-400 px-3 py-1 font-semibold text-slate-950 capitalize">{event.category}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-white">{event.creator_college_name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Organizer</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{event.created_by_name}</h2>
                <p className="text-sm text-slate-500">{event.creator_college_name}</p>
              </div>
              {user?.id && (
                <button
                  onClick={handleSaveToggle}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    isSaved ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {isSaved ? "Saved" : "Save Event"}
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Venue</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{event.location || event.creator_college_name || "Not specified"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Event Date</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(event.date)}</p>
              </div>
            </div>

            {event.description && (
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">About</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{event.description}</p>
              </div>
            )}

            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Visit Event Website →
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Activities</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Register for a session</h2>
            </div>
            <p className="text-sm text-slate-500">{activities.length} activities</p>
          </div>

          {activities.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500">No activities have been added yet.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {activities.map((activity) => {
                const existingRegistration = registrationsByActivity[activity.id];
                const isRegistered = existingRegistration?.status === "registered";
                const closed = activity.registration_closed || activity.remaining_seats === 0;

                return (
                  <article key={activity.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{activity.activity_name}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{activity.activity_description}</p>
                      </div>
                      {isRegistered ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">✓ Registered</span>
                      ) : closed ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Registration Closed</span>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <p><strong className="text-slate-900">Venue:</strong> {activity.venue}</p>
                      <p><strong className="text-slate-900">Date:</strong> {activity.event_date_label || formatDate(activity.event_date)}</p>
                      <p><strong className="text-slate-900">Time:</strong> {activity.start_time ? activity.start_time.slice(0, 5) : "Not specified"}</p>
                      <p><strong className="text-slate-900">Available Seats:</strong> {activity.max_participants ?? "Unlimited"}</p>
                      <p><strong className="text-slate-900">Remaining Seats:</strong> {activity.remaining_seats ?? "Unlimited"}</p>
                      <p><strong className="text-slate-900">Registered:</strong> {activity.registration_count || 0}</p>
                    </div>

                    {isRegistered && existingRegistration && (
                      <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                        <p className="font-semibold">Registration ID: {existingRegistration.registration_id}</p>
                        <p className="mt-1">Status: {existingRegistration.status}</p>
                        <p>Payment Status: {existingRegistration.payment_status}</p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={registeringActivityId === activity.id || isRegistered || closed}
                        onClick={() => handleRegister(activity)}
                        className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                          isRegistered || closed
                            ? "cursor-not-allowed bg-slate-300 text-slate-500"
                            : "bg-slate-950 text-white hover:bg-slate-800"
                        }`}
                      >
                        {isRegistered
                          ? "Already Registered"
                          : registeringActivityId === activity.id
                            ? "Registering..."
                            : closed
                              ? "Registration Closed"
                              : "Register Now"}
                      </button>

                      <span className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600">
                        {activity.registration_open ? "Open for registration" : "Closed by organizer"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
