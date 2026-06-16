import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "",
    role: "user",
    college_name: "",
    roll_no: ""
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name || !form.email || !form.password) {
      setError("Name, email and password are required");
      setLoading(false);
      return;
    }

    if (form.role === "president" && (!form.college_name || !form.roll_no)) {
      setError("College name and roll number are required for president registration");
      setLoading(false);
      return;
    }

    if (form.role === "president" && !documentFile) {
      setError("Please upload a PDF with your photo, director letter, and college ID card.");
      setLoading(false);
      return;
    }

    try {
      if (form.role === "president") {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("role", form.role);
        formData.append("college_name", form.college_name);
        formData.append("roll_no", form.roll_no);
        formData.append("document", documentFile);

        await API.post("/auth/register", formData);
      } else {
        await API.post("/auth/register", form);
      }

      setError("");
      if (form.role === "president") {
        alert("Registered as President Applicant. Your PDF has been submitted and is pending admin approval.");
      }
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create account</h2>
      {error && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full border p-2 mb-3 rounded"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full border p-2 mb-3 rounded"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full border p-2 mb-4 rounded"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <label className="block text-sm font-medium mb-1">Register As</label>
        <select
          className="w-full border p-2 mb-4 rounded"
          value={form.role}
          onChange={(e) => {
            const selectedRole = e.target.value;
            setForm({ ...form, role: selectedRole });
            if (selectedRole !== "president") {
              setDocumentFile(null);
            }
          }}
        >
          <option value="user">Regular User</option>
          <option value="president">President Applicant</option>
        </select>

        {form.role === "president" && (
          <>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-sm text-yellow-700 rounded">
              Please upload a single PDF containing:
              <ul className="list-disc list-inside mt-2">
                <li>Your photo</li>
                <li>A letter from your college director</li>
                <li>Your college ID card photo</li>
              </ul>
            </div>

            <label className="block text-sm font-medium mb-1">College Name</label>
            <input
              className="w-full border p-2 mb-3 rounded"
              placeholder="College Name"
              value={form.college_name}
              onChange={(e) => setForm({ ...form, college_name: e.target.value })}
            />

            <label className="block text-sm font-medium mb-1">Roll Number</label>
            <input
              className="w-full border p-2 mb-4 rounded"
              placeholder="Roll Number"
              value={form.roll_no}
              onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
            />

            <label className="block text-sm font-medium mb-1">Upload Required Document (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              className="w-full mb-4"
              onChange={(e) => setDocumentFile(e.target.files[0] || null)}
              required
            />
          </>
        )}

        <button 
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
      </p>
    </div>
  );
}