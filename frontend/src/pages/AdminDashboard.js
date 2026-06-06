import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    API.get("/events/pending").then((res) => setPendingEvents(res.data || []));
    API.get("/president/requests").then((res) => setRequests(res.data || []));
    API.get("/users/all").then((res) => setUsers(res.data || []));
  }, []);

  const approveEvent = async (id) => {
    await API.put(`/events/approve/${id}`);
    setPendingEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const approvePresident = async (id) => {
    await API.put(`/president/approve/${id}`);
    setRequests((prev) => prev.filter((request) => request.id !== id));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-semibold">Admin Dashboard</h2>
        <p className="text-gray-600">Monitor event approvals, review president applications, and manage users.</p>
      </header>

      <section className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Pending Event Approvals</h3>
        {pendingEvents.length === 0 ? (
          <div className="text-gray-600">No pending events at the moment.</div>
        ) : (
          <div className="grid gap-4">
            {pendingEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h4 className="font-semibold">{event.title}</h4>
                  <p className="text-gray-600 text-sm">{event.description}</p>
                </div>
                <button
                  onClick={() => approveEvent(event.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Approve Event
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">President Approval Requests</h3>
        {requests.length === 0 ? (
          <div className="text-gray-600">No president approvals waiting.</div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <div key={request.id} className="p-4 border rounded flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <div className="font-semibold">{request.name}</div>
                  <div className="text-sm text-gray-600">{request.email}</div>
                  <div className="text-sm text-gray-600">College ID: {request.college_id}</div>
                </div>
                <button
                  onClick={() => approvePresident(request.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Approve President
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Users</h3>
        <div className="grid gap-3">
          {users.map((user) => (
            <div key={user.id} className="p-4 border rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              <div className="text-sm text-gray-700">Role: {user.role}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
