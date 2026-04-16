import { useEffect, useState } from "react";
import API from "../services/api";

export default function Home() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events").then(res => setEvents(res.data));
  }, []);

  return (
    <div>
      <h1>All Events</h1>
      {events.map(e => (
        <div key={e.id}>
          <h3>{e.title}</h3>
          <p>{e.description}</p>
          <p>{e.category}</p>
          <p>{e.location}</p>
        </div>
      ))}
    </div>
  );
}