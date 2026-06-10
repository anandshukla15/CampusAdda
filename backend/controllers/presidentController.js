const db = require("../config/db");

exports.applyPresident = (req, res) => {
  const userId = req.user.id;
  const { name, roll_no, college_name } = req.body;
  const document_url = req.file ? req.file.path : req.body.document_url || null;

  if (!name || !roll_no || !college_name) {
    return res.status(400).json({ error: "name, roll_no and college_name are required" });
  }

  db.query(
    "INSERT INTO president_applications (user_id, name, roll_no, college_name, document_url, status) VALUES (?, ?, ?, ?, ?, 'pending') ON DUPLICATE KEY UPDATE document_url = ?, status = 'pending'",
    [userId, name, roll_no, college_name, document_url, document_url],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ msg: "President application submitted" });
    }
  );
};

exports.getPresidentRequests = (req, res) => {
  db.query(
    "SELECT pa.id, pa.user_id, pa.name, pa.roll_no, pa.college_name, pa.document_url, u.email FROM president_applications pa JOIN users u ON pa.user_id = u.id WHERE pa.status = 'pending' ORDER BY pa.submitted_at DESC",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
};

exports.approvePresident = (req, res) => {
  const { userId } = req.params;

  db.query(
    "UPDATE president_applications SET status = 'approved', approved_at = NOW() WHERE user_id = ?",
    [userId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query("UPDATE users SET role = 'president' WHERE id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ msg: "President approved" });
      });
    }
  );
};
