const db = require("../config/db");

const NOTIFICATION_TTL_HOURS = 24;

exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    await db.query(
      `DELETE FROM notifications
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [NOTIFICATION_TTL_HOURS]
    );

    const [result] = await db.query(
      `SELECT *
       FROM notifications
       WHERE is_read = 0
       AND (
         recipient_user_id = ?
         OR recipient_role = 'all'
         OR recipient_role = ?
       )
       ORDER BY created_at DESC`,
      [userId, role]
    );

    res.json(result);

  } catch (error) {
    console.error("Failed to load notifications:", error);

    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }

    res.status(500).json({
      error: error.message
    });
  }
};

// Mark notification as read and remove it from the visible list
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const [result] = await db.query(
      "SELECT * FROM notifications WHERE id = ?",
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    const notif = result[0];

    if (
      notif.recipient_user_id &&
      notif.recipient_user_id !== userId
    ) {
      return res.status(403).json({
        error: "Not authorized to mark this notification"
      });
    }

    if (
      notif.recipient_role &&
      notif.recipient_role !== "all" &&
      notif.recipient_role !== role
    ) {
      return res.status(403).json({
        error: "Not authorized to mark this notification"
      });
    }

    await db.query(
      "DELETE FROM notifications WHERE id = ?",
      [id]
    );

    res.json({
      message: "Notification dismissed"
    });

  } catch (error) {
    console.error("Error marking notification as read:", error);

    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
};