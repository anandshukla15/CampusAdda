import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get(`/events/${id}`).then((res) => setEvent(res.data)).catch(() => setEvent(null));
  }, [id]);

  const saveEvent = () => {
    const numericId = Number(id);
    const saved = JSON.parse(localStorage.getItem("savedEvents") || "[]");
    if (!saved.includes(numericId)) {
      localStorage.setItem("savedEvents", JSON.stringify([...saved, numericId]));
      setSaving(true);
      setTimeout(() => setSaving(false), 700);
    }
  };

  if (!event) return <div className="max-w-4xl mx-auto p-6">Event not found or loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <button
            onClick={saveEvent}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {saving ? "Saved" : "Save Event"}
          </button>
        </div>
        <div className="text-gray-600">Category: {event.category}</div>
        <div className="text-gray-600">Location: {event.location}</div>
        <div className="text-gray-600">City: {event.city || "N/A"}</div>
        <div className="text-gray-600">Starts: {event.start_date}</div>
        <div className="text-gray-600">Ends: {event.end_date}</div>
        <p className="mt-4 text-gray-800">{event.description}</p>
      </div>
    </div>
  );
}
