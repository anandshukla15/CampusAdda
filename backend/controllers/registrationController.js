const {
  createRegistration,
  getUserRegistrations,
  getRegistrationById,
  cancelRegistration,
  getActivityParticipantSummary,
  getActivityWithContext,
  getRegisteredCount,
  canManageActivity,
  isRegistrationClosed,
  createError,
  query,
  getPresidentSummary
} = require("../services/registrationService");

const formatDateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Not specified";

const formatTimeLabel = (value) => (value ? String(value).slice(0, 5) : "Not specified");

const buildActivityResponse = async (activity, userId = null) => {
  const registrationCount = await getRegisteredCount(activity.id);
  const remainingSeats = activity.max_participants
    ? Math.max(Number(activity.max_participants) - registrationCount, 0)
    : null;

  let myRegistration = null;
  if (userId) {
    const rows = await query(
      `SELECT id, registration_id, status, payment_status, attendance_status, registered_at
       FROM registrations
       WHERE user_id = ? AND activity_id = ?
       LIMIT 1`,
      [userId, activity.id]
    );
    myRegistration = rows[0] || null;
  }

  return {
    ...activity,
    event_date_label: formatDateLabel(activity.event_date),
    start_time_label: formatTimeLabel(activity.start_time),
    registration_count: registrationCount,
    remaining_seats: remainingSeats,
    registration_closed: isRegistrationClosed(activity),
    my_registration: myRegistration
  };
};

exports.create = async (req, res) => {
  try {
    const { activity_id, activityId } = req.body;
    const targetActivityId = activity_id || activityId;

    if (!targetActivityId) {
      return res.status(400).json({ error: "activity_id is required" });
    }

    const result = await createRegistration({
      userId: req.user.id,
      activityId: targetActivityId
    });

    res.status(201).json({
      message: "Registration successful",
      registration: result.registration,
      remainingSeats: result.remainingSeats
    });
  } catch (error) {
    const message = error.message || "Unable to register for activity";
    res.status(error.statusCode || 500).json({ error: message });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await getUserRegistrations(req.user.id);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRegistration = async (req, res) => {
  try {
    const registration = await getRegistrationById(req.params.id);
    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    const isOwner = Number(registration.user_id) === Number(req.user.id);
    const isAdmin = req.user.role === "admin";
    const isPresidentOwner =
      req.user.role === "president" && Number(registration.created_by) === Number(req.user.id);

    if (!isOwner && !isAdmin && !isPresidentOwner) {
      return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeRegistration = async (req, res) => {
  try {
    const result = await cancelRegistration({
      registrationId: req.params.id,
      user: req.user
    });

    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getActivityParticipants = async (req, res) => {
  try {
    const summary = await getActivityParticipantSummary(req.params.activityId);

    if (!canManageActivity(req.user, summary.activity)) {
      return res.status(403).json({ error: "You can only view participants for your own activities" });
    }

    res.json(summary);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getAdminRegistrations = async (req, res) => {
  try {
    const registrations = await query(
      `SELECT r.id, r.registration_id, r.status, r.payment_status, r.attendance_status,
              r.registered_at, r.created_at, r.updated_at,
              u.id as user_id, u.name as student_name, u.email, u.college_name,
              ea.id as activity_id, ea.activity_name, ea.venue, ea.event_date, ea.start_time,
              e.id as event_id, e.name as event_name, e.category,
              creator.name as organizer_name, creator.college_name as organizer_college_name
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN event_activities ea ON r.activity_id = ea.id
       JOIN events e ON ea.event_id = e.id
       JOIN users creator ON e.created_by = creator.id
       ORDER BY r.registered_at DESC, r.id DESC`);

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAdminSummary = async (req, res) => {
  try {
    const [summary] = await query(
      `SELECT
         (SELECT COUNT(*) FROM users) AS total_users,
         (SELECT COUNT(*) FROM users WHERE role = 'president') AS total_presidents,
         (SELECT COUNT(*) FROM events) AS total_events,
         (SELECT COUNT(*) FROM event_activities) AS total_activities,
         (SELECT COUNT(*) FROM registrations) AS total_registrations,
         (SELECT COUNT(*) FROM events WHERE date >= NOW()) AS upcoming_events`
    );

    const [mostRegisteredActivities, mostPopularColleges, monthlyRegistrations, mostPopularCategories] = await Promise.all([
      query(
        `SELECT ea.id, ea.activity_name, e.name as event_name, COUNT(r.id) as total_registrations
         FROM event_activities ea
         JOIN events e ON ea.event_id = e.id
         LEFT JOIN registrations r ON r.activity_id = ea.id AND r.status = 'registered'
         GROUP BY ea.id
         ORDER BY total_registrations DESC, ea.id DESC
         LIMIT 10`
      ),
      query(
        `SELECT COALESCE(u.college_name, 'Unknown') AS college_name, COUNT(*) AS total_registrations
         FROM registrations r
         JOIN users u ON r.user_id = u.id
         GROUP BY COALESCE(u.college_name, 'Unknown')
         ORDER BY total_registrations DESC, college_name ASC
         LIMIT 10`
      ),
      query(
        `SELECT DATE_FORMAT(registered_at, '%Y-%m') AS month, COUNT(*) AS total_registrations
         FROM registrations
         GROUP BY DATE_FORMAT(registered_at, '%Y-%m')
         ORDER BY month DESC
         LIMIT 12`
      ),
      query(
        `SELECT e.category, COUNT(r.id) AS total_registrations
         FROM registrations r
         JOIN event_activities ea ON r.activity_id = ea.id
         JOIN events e ON ea.event_id = e.id
         GROUP BY e.category
         ORDER BY total_registrations DESC`
      )
    ]);

    res.json({
      summary,
      mostRegisteredActivities,
      mostPopularColleges,
      monthlyRegistrations,
      mostPopularCategories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPresidentSummary = async (req, res) => {
  try {
    const data = await getPresidentSummary(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
