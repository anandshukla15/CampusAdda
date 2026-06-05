import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events").then((res) => setEvents(res.data || []));
  }, []);

  const approve = async (id) => {
    await API.put(`/events/approve/${id}`);
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Admin Panel</h2>
      <div className="grid gap-4">
        {events.length === 0 && (
          <div className="text-gray-600">No events pending approval.</div>
        )}

        {events.map((e) => (
          <div
            key={e.id}
            className="p-4 border rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <h3 className="font-medium">{e.title}</h3>
              <p className="text-sm text-gray-600">{e.description}</p>
            </div>
            <button
              onClick={() => approve(e.id)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}