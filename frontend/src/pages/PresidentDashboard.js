import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";

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

  const deleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await API.delete(`/api/events/${eventId}`);
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
                  <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
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

function EventForm({ event, onSuccess }) {
  const [form, setForm] = useState(event ? {
    name: event.name,
    category: event.category,
    date: event.date?.split('T')[0],
    description: event.description || "",
    link: event.link || "",
    photo_url: event.photo_url || ""
  } : {
    name: "",
    category: "cultural",
    date: "",
    description: "",
    link: "",
    photo_url: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.date) {
      setError("Event name and date are required");
      setLoading(false);
      return;
    }

    try {
      if (event) {
        await API.put(`/api/events/${event.id}`, form);
        alert("Event updated successfully");
      } else {
        await API.post("/api/events", form);
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

      <div>
        <label className="block text-sm font-medium mb-1">Event Name</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Enter event name"
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
            <option value="cultural">Cultural</option>
            <option value="sports">Sports</option>
            <option value="tech">Tech</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
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
          placeholder="Event description..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Event Link (Optional)</label>
        <input
          type="url"
          className="w-full border p-2 rounded"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="https://example.com/event"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Photo URL (Optional)</label>
        <input
          type="url"
          className="w-full border p-2 rounded"
          value={form.photo_url}
          onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

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
