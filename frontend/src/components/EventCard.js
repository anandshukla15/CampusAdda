import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";

export default function EventCard({ event }) {
  const user = getUser();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSaved = async () => {
      try {
        const res = await API.get("/events/saved/all");
        const savedIds = res.data?.map((e) => e.id) || [];
        if (mounted) setIsSaved(savedIds.includes(event.id));
      } catch (err) {
        console.error("Failed to check saved status", err);
      }
    };

    if (user?.id) fetchSaved();

    return () => {
      mounted = false;
    };
  }, [user?.id, event.id]);

  const handleSaveToggle = async () => {
    if (!user?.id) {
      alert("Please log in to save events");
      return;
    }

    try {
      if (isSaved) {
        await API.delete(`/events/${event.id}/save`);
      } else {
        await API.post(`/events/${event.id}/save`);
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error("Failed to toggle save", err);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition duration-200">
      {/* Event Image */}
      {event.photo_url && (
        <div className="h-40 bg-gray-200 overflow-hidden">
          <img
            src={event.photo_url}
            alt={event.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x200?text=Event";
            }}
          />
        </div>
      )}

      {/* Event Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1 line-clamp-2">{event.name}</h3>
            <div className="flex gap-2 flex-wrap mb-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded capitalize">
                {event.category}
              </span>
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                {event.created_by_name}
              </span>
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
        )}

        {/* Date */}
        <div className="text-sm text-gray-700 font-medium mb-3">
          📅 {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
          >
            View Details
          </Link>
          {user?.id && (
            <button
              onClick={handleSaveToggle}
              className={`px-3 py-2 rounded font-medium text-sm ${
                isSaved
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {isSaved ? "✓ Saved" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}