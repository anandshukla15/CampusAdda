const db= require("../config/db");

exports.addCollege = (req, res) => {
  const { name, city, state, email_domain } = req.body;

  db.query(
    "INSERT INTO colleges (name,city,state,email_domain) VALUES (?,?,?,?)",
    [name, city, state, email_domain],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "College added" });
    }
  );
};