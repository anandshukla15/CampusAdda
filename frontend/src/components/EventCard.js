import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";

export default function EventCard({ event }) {
  const user = getUser();
  const [isSaved, setIsSaved] = useState(false);
  const activities = event.activities || [];
  const firstActivity = activities[0];

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
                {event.creator_college_name}

              </span>
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
        )}

        <div className="text-sm text-gray-700 mb-3 space-y-1">
          <p className="font-medium">Location: {event.location || event.creator_college_name || "Not specified"}</p>
          <p>{activities.length} activit{activities.length === 1 ? "y" : "ies"}</p>
          {firstActivity && (
            <p>
              Starts: {new Date(firstActivity.event_date).toLocaleDateString()}
              {firstActivity.start_time ? ` at ${firstActivity.start_time.slice(0, 5)}` : ""}
            </p>
          )}
        </div>

        {activities.length > 0 && (
          <div className="mb-4 space-y-2">
            {activities.slice(0, 2).map((activity) => (
              <div key={activity.id || activity.activity_name} className="bg-gray-50 border rounded p-2 text-sm">
                <p className="font-semibold text-gray-900">{activity.activity_name}</p>
                <p className="text-gray-600">{activity.venue}</p>
              </div>
            ))}
            {activities.length > 2 && (
              <p className="text-xs text-gray-500">+{activities.length - 2} more activities</p>
            )}
          </div>
        )}

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
              {isSaved ? "Saved" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
