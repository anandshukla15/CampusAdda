const express = require("express");
const axios = require("axios");
const db = require("../config/db");
const https = require("https");

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const queryDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const attachActivities = async (events) => {
  if (!events.length) return events;

  const eventIds = events.map((event) => event.id);
  const activities = await queryDb(
    `SELECT *
     FROM event_activities
     WHERE event_id IN (?)
     ORDER BY event_date ASC, start_time ASC, id ASC`,
    [eventIds]
  );

  const activitiesByEvent = activities.reduce((acc, activity) => {
    if (!acc[activity.event_id]) acc[activity.event_id] = [];
    acc[activity.event_id].push(activity);
    return acc;
  }, {});

  return events.map((event) => ({
    ...event,
    activities: activitiesByEvent[event.id] || []
  }));
};

const getSearchTerms = (search) => {
  const terms = search
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3);

  return [...new Set([search.toLowerCase(), ...terms].filter(Boolean))];
};

router.post("/chat", async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/langgraph/chat`,
      { query: query.trim() },
      { timeout: 30000 }
    );

    res.json(response.data);
  } catch (error) {
    console.error("AI chat failed:", error.message);
    res.status(502).json({
      error: "AI service is not available right now. Please try again."
    });
  }
});

router.get("/events", async (req, res) => {
  try {
    const events = await queryDb(
      `SELECT e.id, e.name, e.category, e.date, e.description, e.location, e.link,
              u.name as created_by_name, u.college_name as creator_college_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       ORDER BY e.date ASC
       LIMIT 20`
    );

    res.json(await attachActivities(events));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/events/search", async (req, res) => {
  const search = (req.query.q || "").trim();
  const terms = getSearchTerms(search);
  const searchConditions = [];
  const searchParams = [];

  terms.forEach((term) => {
    const like = `%${term}%`;
    searchConditions.push(
      `e.name LIKE ?
       OR e.category LIKE ?
       OR e.description LIKE ?
       OR e.location LIKE ?
       OR u.college_name LIKE ?
       OR EXISTS (
         SELECT 1
         FROM event_activities ea
         WHERE ea.event_id = e.id
           AND (
             ea.activity_name LIKE ?
             OR ea.activity_description LIKE ?
             OR ea.activity_type LIKE ?
             OR ea.venue LIKE ?
           )
       )`
    );
    searchParams.push(like, like, like, like, like, like, like, like, like);
  });

  try {
    const events = await queryDb(
      `SELECT e.id, e.name, e.category, e.date, e.description, e.location, e.link,
              u.name as created_by_name, u.college_name as creator_college_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       WHERE ? = ''
          OR ${searchConditions.length ? searchConditions.map((condition) => `(${condition})`).join(" OR ") : "1 = 1"}
       ORDER BY e.date ASC
       LIMIT 10`,
      [search, ...searchParams]
    );

    res.json(await attachActivities(events));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/events/index", async (req, res) => {
  try {
    const event = req.body;
    if (!event || !event.name) {
      return res.status(400).json({ error: "Event payload is required" });
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/index-event`,
      event,
      { timeout: 30000 }
    );

    res.json(response.data);
  } catch (error) {
    console.error("AI event indexing failed:", error.message);
    res.status(502).json({ error: "AI indexing service is unavailable" });
  }
});

router.get("/activities/search", async (req, res) => {
  const search = (req.query.q || "").trim();
  const terms = getSearchTerms(search);
  const searchConditions = [];
  const searchParams = [];

  terms.forEach((term) => {
    const like = `%${term}%`;
    searchConditions.push(
      `ea.activity_name LIKE ?
       OR ea.activity_description LIKE ?
       OR ea.activity_type LIKE ?
       OR ea.venue LIKE ?
       OR e.name LIKE ?
       OR e.category LIKE ?`
    );
    searchParams.push(like, like, like, like, like, like);
  });

  try {
    const activities = await queryDb(
      `SELECT ea.*, e.name as event_name, e.category, e.location as event_location
       FROM event_activities ea
       JOIN events e ON ea.event_id = e.id
       WHERE ? = ''
          OR ${searchConditions.length ? searchConditions.map((condition) => `(${condition})`).join(" OR ") : "1 = 1"}
       ORDER BY ea.event_date ASC, ea.start_time ASC
       LIMIT 10`,
      [search, ...searchParams]
    );

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
