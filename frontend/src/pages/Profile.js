import { useEffect, useState } from "react";
import API from "../services/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    API.get("/users/profile").then((res) => setProfile(res.data));
  }, []);

  if (!profile) return <div className="max-w-4xl mx-auto p-6">Loading profile…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>
      <div className="grid gap-3 text-gray-700">
        <div><strong>Name:</strong> {profile.name}</div>
        <div><strong>Email:</strong> {profile.email}</div>
        <div><strong>Role:</strong> {profile.role}</div>
        <div><strong>College ID:</strong> {profile.college_id || "Not assigned"}</div>
        <div><strong>Verified:</strong> {profile.is_verified ? "Yes" : "No"}</div>
      </div>
    </div>
  );
}
