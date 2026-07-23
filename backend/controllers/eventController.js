const db = require("../config/db");
const socketConfig = require("../config/socket");
const EventActivity = require("../models/EventActivity");
const transaction = require("../utils/transaction");
const axios = require("axios");

const query = EventActivity.query;

const beginTransaction = () =>
  new Promise((resolve, reject) => db.beginTransaction((err) => (err ? reject(err) : resolve())));

const commit = () =>
  new Promise((resolve, reject) => db.commit((err) => (err ? reject(err) : resolve())));

const rollback = () =>
  new Promise((resolve) => db.rollback(() => resolve()));

const isEventManager = (user) => user?.role === "president" || user?.role === "admin";

const getEventDate = (date, activities = [], fallbackDate = null) => {
  if (date) return date;

  const activityDates = activities
    .map((activity) => activity.event_date)
    .filter(Boolean)
    .sort();

  return activityDates[0] || fallbackDate;
};

const attachActivities = async (events) => {
  if (!events.length) return events;

  const eventIds = events.map((event) => event.id);
  const activities = await query(
    `SELECT *
     FROM event_activities
     WHERE event_id IN (?)
     ORDER BY event_date ASC, start_time ASC, id ASC`,
    [eventIds]
  );

  const activityIds = activities.map((activity) => activity.id);
  const registrationCounts = activityIds.length
    ? await query(
        `SELECT activity_id, COUNT(*) AS total
         FROM registrations
         WHERE activity_id IN (?) AND status = 'registered'
         GROUP BY activity_id`,
        [activityIds]
      )
    : [];

  const countsByActivity = registrationCounts.reduce((acc, row) => {
    acc[row.activity_id] = Number(row.total || 0);
    return acc;
  }, {});

  const activitiesByEvent = activities.reduce((acc, activity) => {
    if (!acc[activity.event_id]) acc[activity.event_id] = [];
    acc[activity.event_id].push({
      ...activity,
      registration_count: countsByActivity[activity.id] || 0,
      remaining_seats:
        activity.max_participants != null
          ? Math.max(Number(activity.max_participants) - (countsByActivity[activity.id] || 0), 0)
          : null,
      registration_closed: !activity.registration_open
    });
    return acc;
  }, {});

  return events.map((event) => ({
    ...event,
    activities: activitiesByEvent[event.id] || []
  }));
};

const triggerAiIndexing = async (eventPayload, activities = []) => {
  try {
    await axios.post(
      `${process.env.AI_SERVICE_URL || "http://localhost:8000"}/index-event`,
      { ...eventPayload, activities },
      { timeout: 15000 }
    );
  } catch (error) {
    console.error("AI indexing failed:", error.message);
  }
};

const sendNewEventNotification = async (
  eventId,
  event,
  creatorRole
) =>{
  if (creatorRole !== "president") {
    return;
  }

  const message = `New event added: ${event.name}`;
  const data = JSON.stringify({
    eventId,
    name: event.name,
    category: event.category,
    date: event.date,
    created_by: event.created_by
  });

  db.query(
    "INSERT INTO notifications (recipient_user_id, recipient_role, type, message, data) VALUES (NULL, 'all', 'new_event', ?, ?)",
    [message, data],
    (err) => {
      if (err) console.error("Failed to create notification:", err.message);
    }
  );

  try {
    const io = socketConfig.getIO();
    io.emit("notification", {
      type: "new_event",
      message,
      data: { eventId, name: event.name, category: event.category, date: event.date }
    });
  } catch (err) {
    console.error("Socket emit error:", err.message);
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await query(
      `SELECT e.*, u.name as created_by_name, u.role as creator_role, u.college_name as creator_college_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       ORDER BY e.date DESC`
    );
    res.json(await attachActivities(events));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const events = await query(
      `SELECT e.*, u.name as created_by_name, u.email as creator_email, u.role as creator_role,
              u.college_name as creator_college_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (!events.length) {
      return res.status(404).json({ error: "Event not found" });
    }

    const [event] = await attachActivities(events);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.createEvent = async (req, res) => {
  const userId = req.user.id;

  const {
    name,
    category,
    date,
    description,
    location,
    link,
    photo_url,
    activities = []
  } = req.body;

  if (!isEventManager(req.user)) {
    return res.status(403).json({
      error: "Only presidents and admins can create events"
    });
  }

  if (!name || !category) {
    return res.status(400).json({
      error: "Fest name and category are required"
    });
  }

  if (!["cultural", "sports", "tech"].includes(category)) {
    return res.status(400).json({
      error: "Invalid category"
    });
  }

  const eventDate = getEventDate(date, activities);

  if (!eventDate) {
    return res.status(400).json({
      error: "Add at least one activity date or provide an event date"
    });
  }

  try {
    const eventId = await transaction(async (connection) => {

      const [result] = await connection.query(
        `INSERT INTO events
        (name, category, date, description, location, link, photo_url, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          category,
          eventDate,
          description || null,
          location || null,
          link || null,
          photo_url || null,
          userId
        ]
      );

      const eventId = result.insertId;

      if (activities.length) {
        await EventActivity.bulkCreate(
          eventId,
          activities,
          category,
          connection
        );
      }

      return eventId;
    });

    const persistedEvent = {
      id: eventId,
      name,
      category,
      date: eventDate,
      description,
      location,
      link,
      photo_url,
      created_by: userId
    };

    triggerAiIndexing(persistedEvent, activities)
    .catch(error => {
      console.error("AI indexing failed:", error.message);
    });

    sendNewEventNotification(
      eventId,
      {
        name,
        category,
        date: eventDate,
        created_by: userId
      },
      req.user.role
    );

    res.status(201).json({
      message: "Event created successfully",
      eventId
    });

  } catch (error) {
    console.error("Error creating event:", error);

    res.status(error.statusCode || 500).json({
      error: error.message
    });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { role } = req.user;
  const { name, category, date, description, location, link, photo_url, activities } = req.body;

  try {
    const rows = await query("SELECT * FROM events WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (role !== "admin" && (role !== "president" || rows[0].created_by !== userId)) {
      return res.status(403).json({ error: "You can only edit your own events" });
    }

    if (!name || !category) {
      return res.status(400).json({ error: "Fest name and category are required" });
    }

    if (!["cultural", "sports", "tech"].includes(category)) {
      return res.status(400).json({ error: "Invalid category. Must be cultural, sports, or tech" });
    }

    const eventDate = getEventDate(date, activities || [], rows[0].date);

    await beginTransaction();

    await query(
      `UPDATE events
       SET name = ?, category = ?, date = ?, description = ?, location = ?, link = ?, photo_url = ?
       WHERE id = ?`,
      [
        name.trim(),
        category,
        eventDate,
        description || null,
        location || null,
        link || null,
        photo_url || null,
        id
      ]
    );

    if (Array.isArray(activities)) {
      await EventActivity.replaceForEvent(id, activities, category);
    }

    await commit();

    await triggerAiIndexing({
      id,
      name,
      category,
      date: eventDate,
      description,
      location,
      link,
      photo_url,
      created_by: userId
    }, activities || []);

    res.json({ message: "Event updated successfully" });
  } catch (error) {
    await rollback();
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { role } = req.user;

  try {
    const rows = await query("SELECT created_by FROM events WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (role !== "admin" && (role !== "president" || rows[0].created_by !== userId)) {
      return res.status(403).json({ error: "You can only delete your own events" });
    }

    await query("DELETE FROM events WHERE id = ?", [id]);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEventsByCreator = async (req, res) => {
  try {
    const events = await query(
      `SELECT e.*, u.name as created_by_name, u.college_name as creator_college_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       WHERE e.created_by = ?
       ORDER BY e.date DESC`,
      [req.params.creatorId]
    );
    res.json(await attachActivities(events));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveEvent = async (req, res) => {
  try {
    await query("INSERT INTO saved_events (user_id, event_id) VALUES (?, ?)", [
      req.user.id,
      req.params.eventId
    ]);
    res.status(201).json({ message: "Event saved successfully" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Event already saved" });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.unsaveEvent = async (req, res) => {
  try {
    await query("DELETE FROM saved_events WHERE user_id = ? AND event_id = ?", [
      req.user.id,
      req.params.eventId
    ]);
    res.json({ message: "Event removed from saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSavedEvents = async (req, res) => {
  try {
    const events = await query(
      `SELECT e.*, u.name as created_by_name, u.role as creator_role, u.college_name as creator_college_name
       FROM events e
       JOIN saved_events se ON e.id = se.event_id
       JOIN users u ON e.created_by = u.id
       WHERE se.user_id = ?
       ORDER BY e.date DESC`,
      [req.user.id]
    );
    res.json(await attachActivities(events));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
