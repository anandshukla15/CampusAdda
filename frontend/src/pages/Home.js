import { useEffect, useState } from "react";
import API from "../services/api";
import EventCard from "../components/EventCard";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [category, setCategory] = useState("");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Ask me about campus fests, tech events, sports, venues, or registration links."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleChatSubmit = async (e) => {
    e.preventDefault();

    const query = chatInput.trim();
    if (!query || chatLoading) return;

    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: query }]);
    setChatLoading(true);

    try {
      const res = await API.post("/ai/chat", { query });
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.data?.answer || "I could not find an answer for that."
        }
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err.response?.data?.error || "The chatbot is not available right now."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow p-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">Campus Adda</h1>
        <p className="text-lg">Discover amazing events in your college - Cultural, Sports, and Tech events!</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] mb-8">
        {/* Filters Section */}
        <div className="bg-white rounded shadow p-6">
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

        <section className="bg-white rounded shadow p-4 flex flex-col min-h-[360px]">
          <div className="mb-3">
            <h2 className="text-xl font-semibold">Campus Chatbot</h2>
            <p className="text-sm text-gray-600">Ask about events on Campus Adda</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-72">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded p-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 rounded p-3 text-sm">Thinking...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Search tech fests..."
              className="min-w-0 flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </section>
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
