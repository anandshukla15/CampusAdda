import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import EventCard from "../components/EventCard";
import { getUser } from "../utils/decodeToken";

export default function SavedEvents() {
  const user = getUser();
  const navigate = useNavigate();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    fetchSavedEvents();
  }, [user, navigate]);

  const fetchSavedEvents = async () => {
    try {
      const res = await API.get("/api/events/saved/all");
      setSavedEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load saved events", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading saved events...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Events</h1>
        <p className="text-gray-600">Your collection of bookmarked events</p>
      </div>

      {savedEvents.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">No saved events yet</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          >
            Browse Events
          </a>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
