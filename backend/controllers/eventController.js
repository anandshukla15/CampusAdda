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