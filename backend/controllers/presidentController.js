const db= require("../config/db");

exports.applyPresident = (req, res) => {
  const { college_id } = req.body;
  const userId = req.user.id;

  db.query(
    "UPDATE users SET role='president', college_id=?, document_url=? WHERE id=?",
    [college_id, req.file.path, userId],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Applied for president" });
    }
  );
};

exports.approvePresident = (req, res) => {
  const { userId } = req.params;

  db.query(
    "UPDATE users SET is_verified=TRUE WHERE id=?",
    [userId],
    (err) => {
      res.json({ msg: "President approved" });
    }
  );
};
