import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";
import socket from "../services/socket";
import EventActivityFields from "../components/EventActivityFields";

export default function PresidentDashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const fetchMyEvents = useCallback(async () => {
    try {
      const res = await API.get(`/events/creator/${user.id}`);
      setMyEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    // Check application status if not yet president
    if (user.role !== "president") {
      API.get(`/president/status/${user.id}`)
        .then((res) => setApplicationStatus(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      // Get my events if president
      fetchMyEvents();
    }
  }, [user, navigate, fetchMyEvents]);

  // Listen for president removal
  useEffect(() => {
    const handlePresidentRemoved = (notification) => {
      if (notification.type === "president_removed") {
        // Log out and redirect to login after showing notification
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/login");
        }, 3000);
      }
    };

    socket.on("notification", handlePresidentRemoved);

    return () => {
      socket.off("notification", handlePresidentRemoved);
    };
  }, [navigate]);

  const deleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await API.delete(`/events/${eventId}`);
        alert("Event deleted");
        fetchMyEvents();
      } catch (err) {
        alert("Failed to delete event");
      }
    }
  };

  // Not yet president - show application status
  if (user?.role !== "president") {
    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
      <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">President Application</h2>

        {applicationStatus?.status === "pending" && (
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded mb-4">
            <p className="font-semibold text-yellow-800">Application Pending</p>
            <p className="text-yellow-700 text-sm mt-2">Your application was submitted on {new Date(applicationStatus.submitted_at).toLocaleDateString()}. Please wait for admin approval.</p>
          </div>
        )}

        {applicationStatus?.status === "approved" && (
          <div className="p-4 bg-green-100 border border-green-400 rounded mb-4">
            <p className="font-semibold text-green-800">Application Approved!</p>
            <p className="text-green-700 text-sm mt-2">Congratulations! Your role has been updated to President. Refresh the page to access president features.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Refresh
            </button>
          </div>
        )}

        {applicationStatus?.status === "rejected" && (
          <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
            <p className="font-semibold text-red-800">Application Rejected</p>
            {applicationStatus.admin_comments && (
              <p className="text-red-700 text-sm mt-2">Reason: {applicationStatus.admin_comments}</p>
            )}
          </div>
        )}

        {applicationStatus?.status === "no_application" && (
          <PresidentApplicationForm onSuccess={() => {
            API.get(`/api/president/status/${user.id}`).then((res) => setApplicationStatus(res.data));
          }} />
        )}
      </div>
    );
  }

  // President - show dashboard
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-semibold">President Dashboard</h2>
        <p className="text-gray-600">Create and manage events for your college</p>
      </header>

      {/* Create Event Button */}
      <div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingEvent(null);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
        >
          {showCreateForm ? "Cancel" : "+ Create New Event"}
        </button>
      </div>

      {/* Create/Edit Event Form */}
      {(showCreateForm || editingEvent) && (
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingEvent ? "Edit Event" : "Create New Event"}
          </h3>
          <EventForm
            event={editingEvent}
            onSuccess={() => {
              setShowCreateForm(false);
              setEditingEvent(null);
              fetchMyEvents();
            }}
          />
        </div>
      )}

      {/* My Events */}
      <section className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">My Events ({myEvents.length})</h3>
        {myEvents.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No events created yet. Create your first event!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-lg mb-2">{event.name}</h4>
                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <p><strong>Category:</strong> <span className="capitalize">{event.category}</span></p>
                  <p><strong>Location:</strong> {event.location || event.creator_college_name || "Not specified"}</p>
                  <p><strong>Activities:</strong> {event.activities?.length || 0}</p>
                  {event.description && <p><strong>Description:</strong> {event.description.substring(0, 100)}...</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.roll_no || !form.college_name) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      await API.post(`/api/president/apply/${user.id}`, form);
      alert("Application submitted successfully!");
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Roll Number</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={form.roll_no}
          onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">College Name</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={form.college_name}
          onChange={(e) => setForm({ ...form, college_name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Document Link (Optional)</label>
        <input
          type="url"
          className="w-full border p-2 rounded"
          placeholder="https://example.com/document.pdf"
          value={form.document_url}
          onChange={(e) => setForm({ ...form, document_url: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}

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

function EventForm({ event, onSuccess }) {
  const [form, setForm] = useState(event ? {
    name: event.name,
    category: event.category,
    description: event.description || "",
    location: event.location || "",
    link: event.link || "",
    photo_url: event.photo_url || "",
    activities: event.activities?.length
      ? event.activities.map(formatActivityForForm)
      : [{ ...emptyActivity }]
  } : {
    name: "",
    category: "cultural",
    description: "",
    location: "",
    link: "",
    photo_url: "",
    activities: [{ ...emptyActivity }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateActivity = (index, activity) => {
    const nextActivities = [...form.activities];
    nextActivities[index] = activity;
    setForm({ ...form, activities: nextActivities });
  };

  const addActivity = () => {
    setForm({ ...form, activities: [...form.activities, { ...emptyActivity }] });
  };

  const removeActivity = (index) => {
    setForm({
      ...form,
      activities: form.activities.filter((_, activityIndex) => activityIndex !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.description || !form.location) {
      setError("Fest name, description, and location are required");
      setLoading(false);
      return;
    }

    if (!form.activities.length) {
      setError("Add at least one activity");
      setLoading(false);
      return;
    }

    const invalidActivity = form.activities.find(
      (activity) =>
        !activity.activity_name ||
        !activity.activity_description ||
        !activity.venue ||
        !activity.event_date
    );

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
        alert("Event updated successfully");
      } else {
        await API.post("/events/create", payload);
        alert("Event created successfully");
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-blue-700 mb-2">Step 1: Fest Information</p>
          <label className="block text-sm font-medium mb-1">Fest Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tech Fest 2026"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="w-full border p-2 rounded"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="tech">Tech</option>
              <option value="sports">Sports</option>
              <option value="cultural">Cultural</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="XYZ College"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border p-2 rounded"
            rows="3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Fest description"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Banner Image URL (Optional)</label>
          <input
            type="url"
            className="w-full border p-2 rounded"
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
            placeholder="https://example.com/banner.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fest Link (Optional)</label>
          <input
            type="url"
            className="w-full border p-2 rounded"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="https://example.com/event"
          />
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-blue-700">Step 2: Activities</p>
          <button
            type="button"
            onClick={addActivity}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
          >
            Add Activity
          </button>
        </div>

        {form.activities.map((activity, index) => (
          <EventActivityFields
            key={index}
            activity={activity}
            index={index}
            onChange={updateActivity}
            onRemove={removeActivity}
            canRemove={form.activities.length > 1}
          />
        ))}
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
}
