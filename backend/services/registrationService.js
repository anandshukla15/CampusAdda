const db = require("../config/db");
const { sendRegistrationConfirmation } = require("./emailService");

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const beginTransaction = () =>
  new Promise((resolve, reject) => db.beginTransaction((err) => (err ? reject(err) : resolve())));

const commit = () => new Promise((resolve, reject) => db.commit((err) => (err ? reject(err) : resolve())));

const rollback = () => new Promise((resolve) => db.rollback(() => resolve()));

const formatDateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Not specified";

const formatTimeLabel = (value) => (value ? String(value).slice(0, 5) : "Not specified");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildRegistrationId = (insertId) => {
  const year = new Date().getFullYear();
  return `REG-${year}-${String(insertId).padStart(6, "0")}`;
};

const getActivityWithContext = async (activityId) => {
  const rows = await query(
    `SELECT ea.*, e.id as event_id, e.name as event_name, e.description as event_description,
            e.category, e.location as event_location, e.photo_url as event_photo_url,
            e.link as event_link, e.created_by, u.name as organizer_name,
            u.email as organizer_email, u.college_name as organizer_college_name
     FROM event_activities ea
     JOIN events e ON ea.event_id = e.id
     JOIN users u ON e.created_by = u.id
     WHERE ea.id = ?`,
    [activityId]
  );

  return rows[0] || null;
};

const getRegisteredCount = async (activityId) => {
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM registrations
     WHERE activity_id = ? AND status = 'registered'`,
    [activityId]
  );

  return Number(rows[0]?.total || 0);
};

const hasExistingRegistration = async (userId, activityId) => {
  const rows = await query(
    `SELECT *
     FROM registrations
     WHERE user_id = ? AND activity_id = ?
     LIMIT 1`,
    [userId, activityId]
  );

  return rows[0] || null;
};

const getUser = async (userId) => {
  const rows = await query(
    "SELECT id, name, email, college_name, role FROM users WHERE id = ?",
    [userId]
  );

  return rows[0] || null;
};

const getActivityParticipantSummary = async (activityId) => {
  const activity = await getActivityWithContext(activityId);
  if (!activity) {
    throw createError("Activity not found", 404);
  }

  const participants = await query(
    `SELECT r.id, r.registration_id, r.status, r.payment_status, r.attendance_status,
            r.registered_at, u.id as user_id, u.name as student_name, u.email,
            u.college_name
     FROM registrations r
     JOIN users u ON r.user_id = u.id
     WHERE r.activity_id = ?
     ORDER BY r.registered_at DESC, r.id DESC`,
    [activityId]
  );

  const totalRegistrations = participants.filter((item) => item.status === "registered").length;
  const remainingSeats = activity.max_participants
    ? Math.max(Number(activity.max_participants) - totalRegistrations, 0)
    : null;

  return {
    activity,
    participants,
    totalRegistrations,
    remainingSeats,
    registrationOpen: Boolean(activity.registration_open)
  };
};

const getPresidentSummary = async (presidentId) => {
  const summaryRows = await query(
    `SELECT
       COUNT(DISTINCT e.id) AS total_events,
       COUNT(DISTINCT ea.id) AS total_activities,
       COUNT(DISTINCT r.id) AS total_registrations,
       SUM(CASE WHEN ea.max_participants IS NULL THEN 0 ELSE GREATEST(ea.max_participants - IFNULL(reg_count.total, 0), 0) END) AS remaining_seats
     FROM events e
     LEFT JOIN event_activities ea ON ea.event_id = e.id
     LEFT JOIN (
       SELECT activity_id, COUNT(*) AS total
       FROM registrations
       WHERE status = 'registered'
       GROUP BY activity_id
     ) reg_count ON reg_count.activity_id = ea.id
     LEFT JOIN registrations r ON r.activity_id = ea.id AND r.status = 'registered'
     WHERE e.created_by = ?`,
    [presidentId]
  );

  const myEvents = await query(
    `SELECT e.id, e.name, e.category, e.date, e.description, e.location, e.photo_url,
            u.name as created_by_name, u.college_name as creator_college_name
     FROM events e
     JOIN users u ON e.created_by = u.id
     WHERE e.created_by = ?
     ORDER BY e.date DESC`,
    [presidentId]
  );

  const activityRows = await query(
    `SELECT ea.id, ea.event_id, ea.activity_name, ea.activity_description, ea.activity_type,
            ea.venue, ea.event_date, ea.start_time, ea.max_participants, ea.registration_open,
            e.name AS event_name, e.category,
            COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS registration_count
     FROM event_activities ea
     JOIN events e ON ea.event_id = e.id
     LEFT JOIN registrations r ON r.activity_id = ea.id
     WHERE e.created_by = ?
     GROUP BY ea.id
     ORDER BY ea.event_date ASC, ea.start_time ASC, ea.id ASC`,
    [presidentId]
  );

  return {
    summary: summaryRows[0] || {
      total_events: 0,
      total_activities: 0,
      total_registrations: 0,
      remaining_seats: 0
    },
    events: myEvents,
    activities: activityRows
  };
};

const canManageActivity = (user, activity) => {
  if (!user || !activity) return false;
  return user.role === "admin" || (user.role === "president" && Number(activity.created_by) === Number(user.id));
};

const isRegistrationClosed = (activity) => {
  if (!activity.registration_open) return true;

  const eventDateTime = new Date(
    `${activity.event_date}T${activity.start_time ? String(activity.start_time).slice(0, 8) : "23:59:59"}`
  );

  return Number.isNaN(eventDateTime.getTime()) ? false : eventDateTime < new Date();
};

const createRegistration = async ({ userId, activityId }) => {
  await beginTransaction();

  try {
    const activity = await getActivityWithContext(activityId);
    if (!activity) {
      throw createError("Activity not found", 404);
    }

    const user = await getUser(userId);
    if (!user) {
      throw createError("User not found", 404);
    }

    const existing = await hasExistingRegistration(userId, activityId);
    if (existing) {
      throw createError("You have already registered for this activity.", 409);
    }

    if (isRegistrationClosed(activity)) {
      throw createError("Registration Closed", 400);
    }

    const registeredCount = await getRegisteredCount(activityId);
    if (activity.max_participants && registeredCount >= Number(activity.max_participants)) {
      throw createError("Registration Closed", 400);
    }

    const result = await query(
      `INSERT INTO registrations (user_id, activity_id, status, payment_status, attendance_status)
       VALUES (?, ?, 'registered', 'free', 'pending')`,
      [userId, activityId]
    );

    const registrationId = buildRegistrationId(result.insertId);
    await query(
      "UPDATE registrations SET registration_id = ? WHERE id = ?",
      [registrationId, result.insertId]
    );

    const registration = {
      id: result.insertId,
      registration_id: registrationId,
      status: "registered",
      payment_status: "free",
      attendance_status: "pending"
    };

    const activityPayload = {
      activity_name: activity.activity_name,
      venue: activity.venue,
      event_date_label: formatDateLabel(activity.event_date),
      start_time_label: formatTimeLabel(activity.start_time)
    };

    await commit();

    try {
      await sendRegistrationConfirmation({
        to: user.email,
        studentName: user.name,
        registration,
        activity: activityPayload,
        event: {
          name: activity.event_name
        },
        collegeName: activity.organizer_college_name || user.college_name
      });
    } catch (emailError) {
      console.error("Registration email failed:", emailError.message);
    }

    return {
      registration,
      user,
      activity,
      remainingSeats: activity.max_participants ? Math.max(Number(activity.max_participants) - registeredCount - 1, 0) : null
    };
  } catch (error) {
    await rollback();
    throw error;
  }
};

const getUserRegistrations = async (userId) => {
  return query(
    `SELECT r.id, r.registration_id, r.status, r.payment_status, r.attendance_status,
            r.registered_at, r.created_at, r.updated_at,
            ea.id as activity_id, ea.activity_name, ea.activity_description, ea.activity_type,
            ea.venue, ea.event_date, ea.start_time, ea.max_participants, ea.registration_open,
            e.id as event_id, e.name as event_name, e.category, e.description as event_description,
            e.location as event_location, e.photo_url, e.link, u.name as organizer_name,
            u.college_name as organizer_college_name
     FROM registrations r
     JOIN event_activities ea ON r.activity_id = ea.id
     JOIN events e ON ea.event_id = e.id
     JOIN users u ON e.created_by = u.id
     WHERE r.user_id = ?
     ORDER BY r.registered_at DESC, r.id DESC`,
    [userId]
  );
};

const getRegistrationById = async (registrationId) => {
  const rows = await query(
    `SELECT r.id, r.registration_id, r.user_id, r.activity_id, r.status, r.payment_status,
            r.attendance_status, r.registered_at, r.created_at, r.updated_at,
            u.name as student_name, u.email, u.college_name,
            ea.activity_name, ea.activity_description, ea.venue, ea.event_date, ea.start_time,
            ea.max_participants, ea.registration_open,
            e.name as event_name, e.category, e.location as event_location,
            e.created_by
     FROM registrations r
     JOIN users u ON r.user_id = u.id
     JOIN event_activities ea ON r.activity_id = ea.id
     JOIN events e ON ea.event_id = e.id
     WHERE r.id = ?`,
    [registrationId]
  );

  return rows[0] || null;
};

const cancelRegistration = async ({ registrationId, user }) => {
  await beginTransaction();

  try {
    const rows = await query(
      `SELECT r.*, ea.created_by, ea.event_date, ea.start_time, ea.registration_open
       FROM registrations r
       JOIN event_activities ea ON r.activity_id = ea.id
       WHERE r.id = ?`,
      [registrationId]
    );

    const registration = rows[0];
    if (!registration) {
      throw createError("Registration not found", 404);
    }

    const canCancel = user.role === "admin" || Number(registration.user_id) === Number(user.id);
    if (!canCancel) {
      throw createError("Forbidden. Insufficient permissions.", 403);
    }

    if (registration.status === "completed") {
      throw createError("Cannot cancel a completed registration.", 400);
    }

    if (registration.status === "cancelled") {
      throw createError("Registration is already cancelled.", 400);
    }

    await query(
      `UPDATE registrations
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = ?`,
      [registrationId]
    );

    await commit();

    return { message: "Registration cancelled successfully" };
  } catch (error) {
    await rollback();
    throw error;
  }
};

module.exports = {
  query,
  createError,
  createRegistration,
  getUserRegistrations,
  getRegistrationById,
  cancelRegistration,
  getActivityWithContext,
  getRegisteredCount,
  getActivityParticipantSummary,
  getPresidentSummary,
  canManageActivity,
  isRegistrationClosed
};