import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("applications");
  const [rejectComments, setRejectComments] = useState({});

  useEffect(() => {
    fetchApplications();
    fetchAllEvents();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await API.get("/president/applications/pending");
      setApplications(res.data || []);
    } catch (err) {
      setError("Failed to load applications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  const approveApplication = async (applicationId, userName) => {
    try {
      await API.put(`/president/approve/${applicationId}`, {
        admin_comments: "Approved by admin"
      });
      alert(`${userName} is now a President!`);
      fetchApplications();
    } catch (err) {
      alert("Failed to approve application");
    }
  };

  const rejectApplication = async (applicationId, userName) => {
    const comments = rejectComments[applicationId] || "Application rejected";
    try {
      await API.put(`/president/reject/${applicationId}`, {
        admin_comments: comments
      });
      alert(`Application for ${userName} has been rejected`);
      setRejectComments({ ...rejectComments, [applicationId]: "" });
      fetchApplications();
    } catch (err) {
      alert("Failed to reject application");
    }
  };

  const deleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await API.delete(`/events/${eventId}`);
        alert("Event deleted successfully");
        fetchAllEvents();
      } catch (err) {
        alert("Failed to delete event");
      }
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-semibold">Admin Dashboard</h2>
        <p className="text-gray-600">Manage president applications and events</p>
      </header>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 font-medium ${
            activeTab === "applications" 
              ? "border-b-2 border-blue-600 text-blue-600" 
              : "text-gray-600"
          }`}
        >
          President Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 font-medium ${
            activeTab === "events" 
              ? "border-b-2 border-blue-600 text-blue-600" 
              : "text-gray-600"
          }`}
        >
          All Events ({events.length})
        </button>
      </div>

      {/* President Applications Tab */}
      {activeTab === "applications" && (
        <section className="bg-white rounded shadow p-6">
          <h3 className="text-xl font-semibold mb-4">President Application Requests</h3>
          {applications.length === 0 ? (
            <div className="text-gray-600 text-center py-8">No pending applications</div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{app.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Roll Number</p>
                      <p className="font-semibold">{app.roll_no}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">College</p>
                      <p className="font-semibold">{app.college_name}</p>
                    </div>
                  </div>
                  {app.document_url && (
                    <div className="mb-4">
                      <a href={app.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        View Document
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => approveApplication(app.id, app.name)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Rejection reason (optional)"
                        value={rejectComments[app.id] || ""}
                        onChange={(e) => setRejectComments({ ...rejectComments, [app.id]: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => rejectApplication(app.id, app.name)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <section className="bg-white rounded shadow p-6">
          <h3 className="text-xl font-semibold mb-4">All Events</h3>
          {events.length === 0 ? (
            <div className="text-gray-600 text-center py-8">No events created</div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="grid md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Event Name</p>
                      <p className="font-semibold">{event.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-semibold capitalize">{event.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Created By</p>
                      <p className="font-semibold">{event.created_by_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-semibold capitalize">{event.creator_role}</p>
                    </div>
                  </div>
                  {event.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-gray-800">{event.description}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {event.link && (
                      <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        Event Link
                      </a>
                    )}
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
