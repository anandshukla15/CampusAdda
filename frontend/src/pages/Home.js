import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import socket from "../services/socket";
import EventCard from "../components/EventCard";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ city: "", category: "" });

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

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="City"
          className="border p-2 rounded"
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />

        <select
          className="border p-2 rounded"
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All</option>
          <option value="tech">Tech</option>
          <option value="cultural">Cultural</option>
        </select>

        <button onClick={fetchEvents} className="bg-blue-500 text-white px-4 py-2 rounded">
          Filter
        </button>
      </div>

      <div className="grid gap-4">
        {events.map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
    </div>
  );
}