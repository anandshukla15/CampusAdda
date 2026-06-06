import { Link } from "react-router-dom";

export default function EventCard({ e, onSave, saved }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-5 mb-4 hover:scale-105 transition duration-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-xl font-bold">{e.title}</h2>
          <p className="text-gray-600 mt-2">{e.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            to={`/events/${e.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            View Details
          </Link>
          {onSave && (
            <button
              onClick={() => onSave(e)}
              className={`px-4 py-2 rounded ${saved ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              {saved ? "Saved" : "Save"}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-between items-center mt-4 gap-2 text-sm text-gray-600">
        <span className="text-blue-500">{e.category}</span>
        <span>{e.location}</span>
      </div>
    </div>
  );
}