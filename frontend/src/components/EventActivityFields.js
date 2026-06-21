export default function EventActivityFields({ activity, index, onChange, onRemove, canRemove }) {
  const updateActivity = (field, value) => {
    onChange(index, { ...activity, [field]: value });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-semibold text-gray-900">Activity {index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Activity Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={activity.activity_name}
            onChange={(e) => updateActivity("activity_name", e.target.value)}
            placeholder="Hackathon"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Venue</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={activity.venue}
            onChange={(e) => updateActivity("venue", e.target.value)}
            placeholder="Main Auditorium"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="w-full border p-2 rounded"
          rows="3"
          value={activity.activity_description}
          onChange={(e) => updateActivity("activity_description", e.target.value)}
          placeholder="Activity details"
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={activity.event_date}
            onChange={(e) => updateActivity("event_date", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time (Optional)</label>
          <input
            type="time"
            className="w-full border p-2 rounded"
            value={activity.start_time}
            onChange={(e) => updateActivity("start_time", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Participants (Optional)</label>
          <input
            type="number"
            min="1"
            className="w-full border p-2 rounded"
            value={activity.max_participants}
            onChange={(e) => updateActivity("max_participants", e.target.value)}
            placeholder="100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Registration Link (Optional)</label>
        <input
          type="url"
          className="w-full border p-2 rounded"
          value={activity.registration_link}
          onChange={(e) => updateActivity("registration_link", e.target.value)}
          placeholder="https://example.com/register"
        />
      </div>
    </div>
  );
}
