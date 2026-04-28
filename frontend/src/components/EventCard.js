export default function EventCard({ e }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-5 mb-4 hover:scale-105 transition">
      <h2 className="text-xl font-bold">{e.title}</h2>
      <p className="text-gray-600">{e.description}</p>
      <div className="flex justify-between mt-2">
        <span className="text-blue-500">{e.category}</span>
        <span>{e.location}</span>
      </div>
    </div>
  );
}