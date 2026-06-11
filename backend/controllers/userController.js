const db = require("../config/db");

exports.getProfile = (req, res) => {
  //console.log("User ID from token:", req.user);
  const { id, role } = req.user;
  if (id === "admin") {
    return res.json({ id: "admin", name: "Admin", email: process.env.ADMIN_USERNAME, role: "admin" });
  }

  db.query(
    "SELECT id,name,email,role,college_name,created_at FROM users WHERE id=?",
    [id],
    (err, result) => {
      //console.log("Profile query result:", err);
      if (err) return res.status(500).json(err);
      
      if (!result || result.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(result[0]);
    }
  );
};

exports.getUsers = (req, res) => {
  db.query(
    "SELECT id, name, email, role, college_id, college_name, created_at FROM users",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

// Admin: delete a user
exports.deleteUser = (req, res) => {
  const { userId } = req.params;

  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User deleted" });
  });
};

// Admin: update user role (e.g., remove president -> user)
exports.updateUserRole = (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role) return res.status(400).json({ error: "Role is required" });

  db.query("UPDATE users SET role = ? WHERE id = ?", [role, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // If downgrading to 'user', remove any president application record
    if (role === 'user') {
      db.query("DELETE FROM president_applications WHERE user_id = ?", [userId], (err2) => {
        if (err2) console.error("Error removing president application:", err2.message);
        return res.json({ message: "User role updated" });
      });
    } else {
      res.json({ message: "User role updated" });
    }
  });
};
