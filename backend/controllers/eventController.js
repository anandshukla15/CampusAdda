const db = require("../config/db");
const socketConfig = require("../config/socket");

// Get all events (everyone can view)
exports.getAllEvents = async (req, res) => {
  try {
    db.query(
      `SELECT e.*, u.name as created_by_name, u.role as creator_role, u.college_name as creator_college_name
       FROM events e 
       JOIN users u ON e.created_by = u.id 
       ORDER BY e.date DESC`,
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query(
      `SELECT e.*, u.name as created_by_name, u.email as creator_email, u.college_name as creator_college_name
       FROM events e 
       JOIN users u ON e.created_by = u.id 
       WHERE e.id = ?`,
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result || result.length === 0) {
          return res.status(404).json({ error: "Event not found" });
        }
        res.json(result[0]);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create event (Presidents and Admins only)
exports.createEvent = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { name, category, date, description, link, photo_url } = req.body;

  // Check if user is president or admin
  if (role !== "president" && role !== "admin") {
    return res.status(403).json({ error: "Only presidents and admins can create events" });
  }

  // Validate required fields
  if (!name || !category || !date) {
    return res.status(400).json({ error: "Name, category, and date are required" });
  }

  if (!["cultural", "sports", "tech"].includes(category)) {
    return res.status(400).json({ error: "Invalid category. Must be cultural, sports, or tech" });
  }

  try {
    db.query(
      "INSERT INTO events (name, category, date, description, link, photo_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, category, date, description || null, link || null, photo_url || null, userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const eventId = result.insertId;

        // create notification for all users
        const message = `New event added: ${name}`;
        const data = JSON.stringify({ eventId, name, category, date, created_by: userId });

        db.query(
          "INSERT INTO notifications (recipient_user_id, recipient_role, type, message, data) VALUES (NULL, 'all', 'new_event', ?, ?)",
          [message, data],
          (err) => {
            if (err) console.error("Failed to create notification:", err.message);
          }
        );

        // emit socket notification to all connected clients
        try {
          const io = socketConfig.getIO();
          io.emit("notification", { type: "new_event", message, data: { eventId, name, category, date } });
        } catch (err) {
          console.error("Socket emit error:", err.message);
        }

        res.status(201).json({
          message: "Event created successfully",
          eventId
        });
      }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update event (Presidents/Admins can edit their own or admins can edit any)
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;
  const { name, category, date, description, link, photo_url } = req.body;

  try {
    // Check if event exists and get creator
    db.query(
      "SELECT created_by FROM events WHERE id = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result || result.length === 0) {
          return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization
        if (role !== "admin" && result[0].created_by !== userId) {
          return res.status(403).json({ error: "You can only edit your own events" });
        }

        // Update event
        db.query(
          "UPDATE events SET name=?, category=?, date=?, description=?, link=?, photo_url=? WHERE id=?",
          [name, category, date, description || null, link || null, photo_url || null, id],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Event updated successfully" });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete event (Presidents/Admins can delete their own or admins can delete any)
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // Check if event exists and get creator
    db.query(
      "SELECT created_by FROM events WHERE id = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result || result.length === 0) {
          return res.status(404).json({ error: "Event not found" });
        }

        // Check authorization
        if (role !== "admin" && result[0].created_by !== userId) {
          return res.status(403).json({ error: "You can only delete your own events" });
        }

        // Delete event
        db.query("DELETE FROM events WHERE id = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Event deleted successfully" });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get events by creator
exports.getEventsByCreator = async (req, res) => {
  const { creatorId } = req.params;

  try {
    db.query(
      `SELECT e.*, u.name as created_by_name, u.college_name as creator_college_name
       FROM events e
       JOIN users u ON e.created_by = u.id
       WHERE e.created_by = ?
       ORDER BY e.date DESC`,
      [creatorId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save event (bookmark)
exports.saveEvent = async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.params;

  try {
    db.query(
      "INSERT INTO saved_events (user_id, event_id) VALUES (?, ?)",
      [userId, eventId],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Event already saved" });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Event saved successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unsave event
exports.unsaveEvent = async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.params;

  try {
    db.query(
      "DELETE FROM saved_events WHERE user_id = ? AND event_id = ?",
      [userId, eventId],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Event removed from saved" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get saved events
exports.getSavedEvents = async (req, res) => {
  const userId = req.user.id;

  try {
    db.query(
      `SELECT e.*, u.name as created_by_name, u.role as creator_role, u.college_name as creator_college_name
       FROM events e 
       JOIN saved_events se ON e.id = se.event_id 
       JOIN users u ON e.created_by = u.id 
       WHERE se.user_id = ? 
       ORDER BY e.date DESC`,
      [userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};