import { useState } from "react";
import API from "../services/api";

export default function PresidentDashboard() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!file) return alert("Please choose a document first");
    setLoading(true);
    const formData = new FormData();
    formData.append("document", file);
    formData.append("college_id", 1);

    try {
      await API.post("/president/apply", formData);
      alert("Applied");
      setFile(null);
    } catch (e) {
      alert("Failed to apply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">President Application</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <div>
        <button
          onClick={apply}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Applying..." : "Apply for President"}
        </button>
      </div>
    </div>
  );
}