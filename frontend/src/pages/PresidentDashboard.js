import { useEffect, useState } from "react";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";

export default function PresidentDashboard() {
  const user = getUser();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [collegeId, setCollegeId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.role === "president") {
      API.get("/events/my").then((res) => setEvents(res.data || []));
    }
    API.get("/colleges").then((res) => {
      setColleges(res.data || []);
      if (res.data && res.data.length > 0) {
        setCollegeId(res.data[0].id);
      }
    });
  }, [user]);

  const apply = async () => {
    if (!file) return alert("Please choose a document first");
    setLoading(true);
    const formData = new FormData();
    formData.append("document", file);
    formData.append("college_id", collegeId || 1);

    try {
      await API.post("/president/apply", formData);
      setMessage("Your president application is submitted. Please wait for admin approval.");
      setFile(null);
    } catch (e) {
      setMessage("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "president") {
    return (
      <div className="max-w-5xl mx-auto mt-8 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">President Dashboard</h2>
        <p className="text-gray-600 mb-6">Create and manage events for your college.</p>

        <div className="bg-gray-50 border border-gray-200 rounded p-6 mb-6">
          <h3 className="font-semibold mb-3">Create Event</h3>
          <PresidentEventForm onSuccess={() => API.get("/events/my").then((res) => setEvents(res.data || []))} />
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">My Events</h3>
          {events.length === 0 ? (
            <div className="text-gray-600">No events created yet.</div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded p-4">
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.category} • {event.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (user?.role === "pending_president") {
    return (
      <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">President Application Status</h2>
        <p className="text-gray-600">Your president application is under review. The admin will notify you once it is approved.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Apply to Become President</h2>
      <p className="text-gray-600 mb-4">Submit your college verification document and request approval from the admin.</p>
      {message && <div className="mb-4 text-blue-600">{message}</div>}
      <label className="block text-sm mb-1">Select college</label>
      <select
        value={collegeId}
        onChange={(e) => setCollegeId(e.target.value)}
        className="w-full border p-3 mb-4 rounded"
      >
        {colleges.map((college) => (
          <option key={college.id} value={college.id}>
            {college.name} ({college.city})
          </option>
        ))}
      </select>
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={apply}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Applying..." : "Apply for President"}
      </button>
    </div>
  );
}

function PresidentEventForm({ onSuccess }) {
  const [form, setForm] = useState({ title: "", description: "", category: "", location: "", city: "", start_date: "", end_date: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/events", form);
      onSuccess();
      setForm({ title: "", description: "", category: "", location: "", city: "", start_date: "", end_date: "" });
      alert("Event submitted for approval.");
    } catch (err) {
      alert("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <input
        className="border p-3 rounded"
        placeholder="Event title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        className="border p-3 rounded"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          className="border p-3 rounded"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="border p-3 rounded"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          className="border p-3 rounded"
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          type="date"
          className="border p-3 rounded"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          type="date"
          className="border p-3 rounded"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
        />
      </div>
      <button className="bg-green-600 text-white px-4 py-3 rounded" disabled={loading}>
        {loading ? "Submitting..." : "Submit Event"}
      </button>
    </form>
  );
}
