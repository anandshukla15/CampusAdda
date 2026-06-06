const db= require("../config/db");
const socket= require("../config/socket");

exports.createEvent = (req, res) => {
  const {
    title,
    description,
    category,
    location,
    city,
    start_date,
    end_date
  } = req.body;

  const userId = req.user.id;

  db.query(
    `INSERT INTO events 
    (title,description,category,created_by,location,city,start_date,end_date,is_approved)
    VALUES (?,?,?,?,?,?,?,?,FALSE)`,
    [
      title,
      description,
      category,
      userId,
      location,
      city,
      start_date,
      end_date
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);

      const io = socket.getIO();
      io.emit("new_event", {
        title,
        message: "New event created"
      });

      res.json({ msg: "Event Created Successfully" });
    }
  );
};

exports.getEvents = (req, res) => {
  const { city = "", category = "" } = req.query;
  const sql = `SELECT * FROM events WHERE is_approved=TRUE
    ${city ? "AND city LIKE ?" : ""}
    ${category ? "AND category LIKE ?" : ""}`.replace(/\s+/g, " ");

  const params = [];
  if (city) params.push(`%${city}%`);
  if (category) params.push(`%${category}%`);

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getEventById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM events WHERE id=? AND is_approved=TRUE", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result || result.length === 0) return res.status(404).json({ message: "Event not found" });
    res.json(result[0]);
  });
};

exports.getMyEvents = (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM events WHERE created_by=?", [userId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getPendingEvents = (req, res) => {
  db.query("SELECT * FROM events WHERE is_approved=FALSE", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.approveEvent = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE events SET is_approved=TRUE WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ msg: "Event approved" });
  });
};