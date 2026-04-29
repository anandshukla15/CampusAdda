import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";
import EventCard from "../components/EventCard";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ city: "", category: "" });

  const fetchEvents = () => {
    API.get(`/events?city=${filters.city}&category=${filters.category}`)
      .then(res => setEvents(res.data));
  };

  useEffect(() => {
    fetchEvents();

    socket.on("new_event", (data) => {
      alert("New Event: " + data.title);
      fetchEvents();
    });

  }, []);

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      <div className="flex gap-2 mb-4">
        <input placeholder="City"
          className="border p-2"
          onChange={e => setFilters({...filters, city:e.target.value})}
        />

        <select
          className="border p-2"
          onChange={e => setFilters({...filters, category:e.target.value})}
        >
          <option value="">All</option>
          <option value="tech">Tech</option>
          <option value="cultural">Cultural</option>
        </select>

        <button onClick={fetchEvents} className="bg-blue-500 text-white px-4">
          Filter
        </button>
      </div>

      {events.map(e => <EventCard key={e.id} e={e} />)}
    </div>
  );
}