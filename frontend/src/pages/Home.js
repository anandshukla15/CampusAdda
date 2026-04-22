import { useEffect, useState } from "react";
import API from "../services/api";

export default function Home() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events").then(res => setEvents(res.data));
  }, []);

  return (
    <div>
      <h1>All Events</h1>
      {events.map(e => (
        <div key={e.id}>
          <div className="bg-white shadow-lg rounded-2xl p-5 mb-4 hover:scale-105 transition">
  <h2 className="text-xl font-bold">{e.title}</h2>
  <p className="text-gray-600">{e.description}</p>
  <div className="flex justify-between mt-2">
    <span className="text-blue-500">{e.category}</span>
    <span>{e.location}</span>
  </div>
</div>
        </div>
      ))}
    </div>
  );
}