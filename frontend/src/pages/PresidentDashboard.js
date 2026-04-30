import { useState } from "react";
import API from "../services/api";

export default function PresidentDashboard() {
  const [file, setFile] = useState(null);

  const apply = async () => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("college_id", 1);

    await API.post("/president/apply", formData);
    alert("Applied");
  };

  return (
    <div className="p-5">
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={apply} className="bg-blue-500 text-white px-4">
        Apply President
      </button>
    </div>
  );
}