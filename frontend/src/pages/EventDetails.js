import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";

export default function EventDetails() {
  const { id } = useParams();
  const user = getUser();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await API.get(`/events/${id}`);
        if (!mounted) return;
        setEvent(res.data);

        if (user?.id) {
          try {
            const r2 = await API.get("/events/saved/all");
            const savedIds = r2.data?.map((e) => e.id) || [];
            if (mounted) setIsSaved(savedIds.includes(parseInt(id)));
          } catch (e) {
            console.error("Failed to check saved status", e);
          }
        }
      } catch (err) {
        console.error("Failed to load event", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, user?.id]);

  const handleSaveToggle = async () => {
    if (!user?.id) {
      alert("Please log in to save events");
      return;
    }

    try {
      if (isSaved) {
        await API.delete(`/api/events/${id}/save`);
      } else {
        await API.post(`/api/events/${id}/save`);
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error("Failed to toggle save", err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!event) {
    return <div className="p-6 text-center text-gray-600">Event not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded shadow overflow-hidden">
        {/* Event Image */}
        {event.photo_url && (
          <div className="h-96 bg-gray-300 overflow-hidden">
            <img
              src={event.photo_url}
              alt={event.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/800x400?text=Event";
              }}
            />
          </div>
        )}

        {/* Event Details */}
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
              <div className="flex gap-3 flex-wrap mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 font-semibold rounded capitalize">
                  {event.category}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 font-semibold rounded">
                  By {event.created_by_name}
                </span>
              </div>
            </div>
            {user?.id && (
              <button
                onClick={handleSaveToggle}
                className={`px-6 py-3 rounded font-semibold ${
                  isSaved
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isSaved ? "✓ Saved" : "Save Event"}
              </button>
            )}
          </div>

          {/* Event Info Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 pb-8 border-b">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">EVENT DATE & TIME</p>
              <p className="text-2xl font-semibold">
                📅 {new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
              <p className="text-lg text-gray-700 mt-1">
                🕐 {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">ORGANIZER</p>
              <p className="text-xl font-semibold">{event.created_by_name}</p>
              {event.creator_role && (
                <p className="text-gray-700 capitalize">Role: {event.creator_role}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Event Link */}
          {event.link && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Event Link</h2>
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              >
                Visit Event Website →
              </a>
            </div>
          )}

          {/* Contact */}
          <div className="bg-gray-50 p-6 rounded">
            <h2 className="text-xl font-semibold mb-2">Contact Organizer</h2>
            <p className="text-gray-700">Email: {event.creator_email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
