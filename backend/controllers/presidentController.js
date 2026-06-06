const db= require("../config/db");

exports.applyPresident = (req, res) => {
  const { college_id } = req.body;
  const userId = req.user.id;

  db.query(
    "UPDATE users SET role='pending_president', college_id=?, document_url=?, is_verified=FALSE WHERE id=?",
    [college_id, req.file.path, userId],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "President application submitted" });
    }
  );
};

exports.getPresidentRequests = (req, res) => {
  db.query(
    "SELECT id,name,email,college_id,document_url FROM users WHERE role='pending_president'",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

exports.approvePresident = (req, res) => {
  const { userId } = req.params;

  db.query(
    "UPDATE users SET role='president', is_verified=TRUE WHERE id=?",
    [userId],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "President approved" });
    }
  );
};
