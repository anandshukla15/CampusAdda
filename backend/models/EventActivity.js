const db = require("../config/db");

const query = async (sql, params = []) => {
  const [rows] = await db.query(sql, params);
  return rows;
};

const normalizeActivity = (activity, eventId, fallbackType) => ({
  event_id: eventId,
  activity_name: activity.activity_name?.trim(),
  activity_description: activity.activity_description?.trim(),
  activity_type: (activity.activity_type || fallbackType || "").trim(),
  venue: activity.venue?.trim(),
  event_date: activity.event_date,
  start_time: activity.start_time || null,
  registration_link: activity.registration_link?.trim() || null,
  max_participants: activity.max_participants || null
});

const validateActivity = (activity) => {
  if (!activity.activity_name) return "Activity name is required";
  if (!activity.activity_description) return "Activity description is required";
  if (!activity.activity_type) return "Activity type is required";
  if (!activity.venue) return "Venue is required";
  if (!activity.event_date) return "Activity date is required";

  if (
    activity.max_participants !== null &&
    activity.max_participants !== undefined &&
    activity.max_participants !== "" &&
    Number(activity.max_participants) < 1
  ) {
    return "Max participants must be greater than 0";
  }

  return null;
};

const insertActivity = async (activity, connection = db) => {
  const [result] = await connection.query(
    `INSERT INTO event_activities
      (
        event_id,
        activity_name,
        activity_description,
        activity_type,
        venue,
        event_date,
        start_time,
        registration_link,
        max_participants
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activity.event_id,
      activity.activity_name,
      activity.activity_description,
      activity.activity_type,
      activity.venue,
      activity.event_date,
      activity.start_time,
      activity.registration_link,
      activity.max_participants
    ]
  );

  return result;
};

exports.query = query;
exports.normalizeActivity = normalizeActivity;
exports.validateActivity = validateActivity;

exports.findByEventId = (eventId) =>
  query(
    `SELECT *
     FROM event_activities
     WHERE event_id = ?
     ORDER BY event_date ASC, start_time ASC, id ASC`,
    [eventId]
  );

exports.findById = (id) =>
  query(
    `SELECT ea.*, e.created_by
     FROM event_activities ea
     JOIN events e ON ea.event_id = e.id
     WHERE ea.id = ?`,
    [id]
  );

exports.create = (activity) => insertActivity(activity);

exports.bulkCreate = async (
  eventId,
  activities,
  fallbackType,
  connection = db
) => {
  const normalizedActivities = activities.map((activity) =>
    normalizeActivity(activity, eventId, fallbackType)
  );

  for (const activity of normalizedActivities) {
    const error = validateActivity(activity);

    if (error) {
      const validationError = new Error(error);
      validationError.statusCode = 400;
      throw validationError;
    }
  }

  for (const activity of normalizedActivities) {
    await insertActivity(activity, connection);
  }

  return normalizedActivities;
};

exports.update = (id, activity) =>
  query(
    `UPDATE event_activities
     SET
       activity_name = ?,
       activity_description = ?,
       activity_type = ?,
       venue = ?,
       event_date = ?,
       start_time = ?,
       registration_link = ?,
       max_participants = ?
     WHERE id = ?`,
    [
      activity.activity_name,
      activity.activity_description,
      activity.activity_type,
      activity.venue,
      activity.event_date,
      activity.start_time,
      activity.registration_link,
      activity.max_participants,
      id
    ]
  );

exports.delete = (id) =>
  query(
    "DELETE FROM event_activities WHERE id = ?",
    [id]
  );

exports.replaceForEvent = async (
  eventId,
  activities,
  fallbackType
) => {
  await query(
    "DELETE FROM event_activities WHERE event_id = ?",
    [eventId]
  );

  return exports.bulkCreate(
    eventId,
    activities,
    fallbackType
  );
};