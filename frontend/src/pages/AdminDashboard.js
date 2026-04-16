import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events").then(res => setEvents(res.data));
  }, []);

  const approve = async (id) => {
    await API.put(`/events/approve/${id}`);
    alert("Approved");
  };

  return (
    <div>
      <h2>Admin Panel</h2>

      {events.map(e => (
        <div key={e.id}>
          <h3>{e.title}</h3>
          <button onClick={() => approve(e.id)}>Approve</button>
        </div>
      ))}
    </div>
  );
}