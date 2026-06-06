import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import socket from "../services/socket";
import EventCard from "../components/EventCard";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ city: "", category: "" });
  const [savedIds, setSavedIds] = useState(() => JSON.parse(localStorage.getItem("savedEvents") || "[]"));

  const fetchEvents = useCallback(() => {
    API.get(`/events?city=${filters.city}&category=${filters.category}`).then(
      (res) => setEvents(res.data || [])
    );
  }, [filters.city, filters.category]);

  useEffect(() => {
    fetchEvents();

    const handler = (data) => {
      alert("New Event: " + data.title);
      fetchEvents();
    };

    socket.on("new_event", handler);
    return () => socket.off("new_event", handler);
  }, [fetchEvents]);

  const saveEvent = (event) => {
    const saved = JSON.parse(localStorage.getItem("savedEvents") || "[]");
    if (!saved.includes(event.id)) {
      const next = [...saved, event.id];
      localStorage.setItem("savedEvents", JSON.stringify(next));
      setSavedIds(next);
    }
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">Campus Adda</h1>
        <p className="text-gray-600">Discover campus events across tech, cultural, sports, and academic communities.</p>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Discover events</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder="City"
            className="border p-3 rounded w-full"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
          <select
            className="border p-3 rounded w-full sm:w-64"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All categories</option>
            <option value="Tech">Tech</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
          </select>
          <button
            onClick={fetchEvents}
            className="bg-blue-600 text-white px-5 py-3 rounded w-full sm:w-auto"
          >
            Search
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {events.length === 0 && <div className="text-gray-600">No events found. Try another city or category.</div>}
        {events.map((event) => (
          <EventCard key={event.id} e={event} onSave={saveEvent} saved={savedIds.includes(event.id)} />
        ))}
      </div>
    </div>
  );
}