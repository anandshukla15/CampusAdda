const db= require("../config/db");

exports.createEvent = async (req, res) => {
     const { title, description, category, location, start_date, end_date } = req.body;
  const userId = req.user.id;

  db.query(
    "INSERT INTO events (title,description,category,created_by,location,start_date,end_date) VALUES (?,?,?,?,?,?,?)",
    [title, description, category, userId, location, start_date, end_date],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Event created" });
    }
  );
};

exports.getEvents = (req, res) => {
  const { city, category } = req.query;

  db.query("SELECT * FROM events WHERE is_approved=TRUE AND (city=? OR city IS NULL) AND (category=? OR category IS NULL)",
    [city, category],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

exports.approveEvent = (req, res) => {
  const { id } = req.params;

  db.query("UPDATE events SET is_approved=TRUE WHERE id=?", [id], () => {
    res.json({ msg: "Event approved" });
  });
};