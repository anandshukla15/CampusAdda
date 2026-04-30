import { useState } from "react";
import API from "../services/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await API.post("/auth/login", form);
    localStorage.setItem("token", res.data.token);
    alert("Login Success");
  };

  return (
    <form className="p-5" onSubmit={handleSubmit}>
      <input placeholder="Email" className="border p-2 block mb-2"
        onChange={e => setForm({...form,email:e.target.value})}
      />
      <input type="password" placeholder="Password"
        className="border p-2 block mb-2"
        onChange={e => setForm({...form,password:e.target.value})}
      />
      <button className="bg-green-500 text-white px-4">Login</button>
    </form>
  );
}