const db = require("../config/db");


// Get logged-in user's profile
exports.getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;

    // Admin profile
    if (id === "admin") {
      return res.json({
        id: "admin",
        name: "AKS",
        email: process.env.ADMIN_USERNAME,
        role: "admin"
      });
    }

    const [result] = await db.query(
      `SELECT 
        id,
        name,
        email,
        role,
        college_name,
        created_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(result[0]);

  } catch (err) {
    console.error("Get profile error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


// Get all users
exports.getUsers = async (req, res) => {
  try {
    const [result] = await db.query(
      `SELECT 
        id,
        name,
        email,
        role,
        college_id,
        college_name,
        created_at
       FROM users`
    );

    res.json(result);

  } catch (err) {
    console.error("Get users error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


// Admin: delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await db.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      message: "User deleted"
    });

  } catch (err) {
    console.error("Delete user error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


// Admin: update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: "Role is required"
      });
    }

    await db.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, userId]
    );

    // If user is downgraded from president to user,
    // delete their president application
    if (role === "user") {
      try {
        await db.query(
          "DELETE FROM president_applications WHERE user_id = ?",
          [userId]
        );
      } catch (err2) {
        console.error(
          "Error removing president application:",
          err2.message
        );
      }
    }

    res.json({
      message: "User role updated"
    });

  } catch (err) {
    console.error("Update user role error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};