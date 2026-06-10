const db = require("../config/db");

exports.getProfile = (req, res) => {
  console.log("User ID from token:", req.user);
  const { id, role } = req.user;
  if (id === "admin") {
    return res.json({ id: "admin", name: "Admin", email: process.env.ADMIN_USERNAME, role: "admin" });
  }

  db.query(
    "SELECT id,name,email,role,college_name,created_at FROM users WHERE id=?",
    [id],
    (err, result) => {
      console.log("Profile query result:", err);
      if (err) return res.status(500).json(err);
      
      if (!result || result.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(result[0]);
    }
  );
};

exports.getUsers = (req, res) => {
  db.query(
    "SELECT id,name,email,role,college_id,is_verified FROM users",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};
