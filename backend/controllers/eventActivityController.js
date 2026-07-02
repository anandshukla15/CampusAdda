const EventActivity = require("../models/EventActivity");

const canManageEvent = (event, user) => {
  if (!user) return false;
  return user.role === "admin" || (user.role === "president" && event.created_by === user.id);
};

const getEvent = async (eventId) => {
  const rows = await EventActivity.query("SELECT id, category, created_by FROM events WHERE id = ?", [eventId]);
  return rows[0];
};

exports.createActivity = async (req, res) => {
  try {
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: "event_id is required" });
    }

    const event = await getEvent(event_id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ error: "You can only manage activities for your own events" });
    }

    const activity = EventActivity.normalizeActivity(req.body, event_id, event.category);
    const validationError = EventActivity.validateActivity(activity);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await EventActivity.create(activity);
    res.status(201).json({ message: "Activity created successfully", activityId: result.insertId });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getActivitiesByEvent = async (req, res) => {
  try {
    const event = await getEvent(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const activities = await EventActivity.findByEventId(req.params.eventId);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const rows = await EventActivity.findById(req.params.id);
    if (!rows.length) {
      return res.status(404).json({ error: "Activity not found" });
    }

    if (!canManageEvent(rows[0], req.user)) {
      return res.status(403).json({ error: "You can only manage activities for your own events" });
    }

    const activity = EventActivity.normalizeActivity(req.body, rows[0].event_id, rows[0].activity_type);
    const validationError = EventActivity.validateActivity(activity);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await EventActivity.update(req.params.id, activity);
    res.json({ message: "Activity updated successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const rows = await EventActivity.findById(req.params.id);
    if (!rows.length) {
      return res.status(404).json({ error: "Activity not found" });
    }

    if (!canManageEvent(rows[0], req.user)) {
      return res.status(403).json({ error: "You can only manage activities for your own events" });
    }

    await EventActivity.delete(req.params.id);
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRegistrationStatus = async (req, res) => {
  try {
    const rows = await EventActivity.findById(req.params.id);
    if (!rows.length) {
      return res.status(404).json({ error: "Activity not found" });
    }

    if (!canManageEvent(rows[0], req.user)) {
      return res.status(403).json({ error: "You can only manage activities for your own events" });
    }

    const registration_open = req.body.registration_open;
    if (registration_open === undefined || registration_open === null) {
      return res.status(400).json({ error: "registration_open is required" });
    }

    await EventActivity.query(
      "UPDATE event_activities SET registration_open = ? WHERE id = ?",
      [registration_open ? 1 : 0, req.params.id]
    );

    res.json({
      message: registration_open ? "Registrations reopened" : "Registrations closed"
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
