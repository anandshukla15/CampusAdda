const db = require("../config/db");

// Get notifications relevant to the logged in user
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    db.query(
      "SELECT * FROM notifications WHERE (recipient_user_id = ? OR recipient_role = 'all' OR recipient_role = ?) ORDER BY created_at DESC",
      [userId, role],
      (err, result) => {
        if (err) {
          if (err.code === "ER_NO_SUCH_TABLE") {
            return res.json([]);
          }

          return res.status(500).json({ error: err.message });
        }
        res.json(result);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Only allow marking if the notification belongs to the user or is for their role/all
    db.query(
      "SELECT * FROM notifications WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          if (err.code === "ER_NO_SUCH_TABLE") {
            return res.status(404).json({ error: "Notification not found" });
          }

          return res.status(500).json({ error: err.message });
        }
        if (!result || result.length === 0) return res.status(404).json({ error: "Notification not found" });

        const notif = result[0];
        if (notif.recipient_user_id && notif.recipient_user_id !== userId) {
          return res.status(403).json({ error: "Not authorized to mark this notification" });
        }

        db.query(
          "UPDATE notifications SET is_read = 1 WHERE id = ?",
          [id],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Notification marked as read" });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
