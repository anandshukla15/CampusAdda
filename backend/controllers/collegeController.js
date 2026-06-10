const db = require("../config/db");

exports.addCollege = (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "College name is required" });

  db.query(
    "INSERT INTO colleges (name) VALUES (?)",
    [name],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "College added" });
    }
  );
};

exports.getColleges = (req, res) => {
  db.query("SELECT id, name, created_at FROM colleges", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};