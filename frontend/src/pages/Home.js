import { useEffect, useState } from "react";
import API from "../services/api";
import EventCard from "../components/EventCard";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [category, setCategory] = useState("");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get("/events");
      setEvents(res.data || []);
      setFilteredEvents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (selectedCategory) => {
    setCategory(selectedCategory);
    setUpcomingOnly(false);
    if (!selectedCategory) {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter((e) => e.category === selectedCategory));
    }
  };

  const handleUpcomingFilter = () => {
    setUpcomingOnly((prev) => !prev);
    if (!upcomingOnly) {
      const now = new Date();
      setFilteredEvents(events.filter((e) => new Date(e.date) >= now));
      setCategory("");
    } else {
      setFilteredEvents(events);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow p-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">Campus Adda</h1>
        <p className="text-lg">Discover amazing events in your college - Cultural, Sports, and Tech events!</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter Events</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleCategoryFilter("")}
            className={`px-4 py-2 rounded font-medium transition ${
              category === ""
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            All CAMPUS FEST
          </button>
          <button
            onClick={handleUpcomingFilter}
            className={`px-4 py-2 rounded font-medium transition ${
              upcomingOnly ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Upcoming
          </button>
          {["cultural", "sports", "tech"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryFilter(cat)}
              className={`px-4 py-2 rounded font-medium transition capitalize ${
                category === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No events found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}