import { useEffect, useState } from "react";
import API from "../services/api";
import EventCard from "../components/EventCard";

export default function SavedEvents() {
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedEvents") || "[]");
    if (saved.length === 0) {
      setSavedEvents([]);
      setLoading(false);
      return;
    }

    Promise.all(saved.map((id) => API.get(`/events/${id}`).then((res) => res.data).catch(() => null))).then(
      (events) => {
        setSavedEvents(events.filter(Boolean));
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Saved Events</h1>
      {loading && <div>Loading saved events...</div>}
      {!loading && savedEvents.length === 0 && <div className="text-gray-600">No saved events yet.</div>}
      <div className="grid gap-4">
        {savedEvents.map((event) => (
          <EventCard key={event.id} e={event} />
        ))}
      </div>
    </div>
  );
}
