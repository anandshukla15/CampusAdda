import { useState } from "react";
import API from "../services/api";

export default function PresidentDashboard() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "tech",
    location: "",
    start_date: "",
    end_date: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/events", form);
    alert("Event Created (Waiting for approval)");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Event</h2>

      <input placeholder="Title" onChange={e => setForm({...form, title:e.target.value})} />
      <textarea placeholder="Description" onChange={e => setForm({...form, description:e.target.value})} />

      <select onChange={e => setForm({...form, category:e.target.value})}>
        <option value="tech">Tech</option>
        <option value="cultural">Cultural</option>
        <option value="sports">Sports</option>
      </select>

      <input placeholder="Location" onChange={e => setForm({...form, location:e.target.value})} />
      <input type="date" onChange={e => setForm({...form, start_date:e.target.value})} />
      <input type="date" onChange={e => setForm({...form, end_date:e.target.value})} />

      <button>Create Event</button>
    </form>
  );
}