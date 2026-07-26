const db = require("../config/db");

const NOTIFICATION_TTL_HOURS = 24;

exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // Delete notifications older than 24 hours
    await db.query(
      `DELETE FROM notifications
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [NOTIFICATION_TTL_HOURS]
    );

    // Get unread notifications for this user/role
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

    return res.json(result);

  } catch (error) {
    console.error("Failed to load notifications:", error);

    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }

    return res.status(500).json({
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
    // Find notification
    const [result] = await db.query(
      `SELECT *
       FROM notifications
       WHERE id = ?`,
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    const notif = result[0];

    // Check user-specific notification permission
    if (
      notif.recipient_user_id !== null &&
      String(notif.recipient_user_id) !== String(userId)
    ) {
      return res.status(403).json({
        error: "Not authorized to mark this notification"
      });
    }

    // Check role-based notification permission
    if (
      notif.recipient_role !== null &&
      notif.recipient_role !== "all" &&
      notif.recipient_role !== role
    ) {
      return res.status(403).json({
        error: "Not authorized to mark this notification"
      });
    }

    // Delete notification
    await db.query(
      `DELETE FROM notifications
       WHERE id = ?`,
      [id]
    );

    return res.json({
      message: "Notification dismissed"
    });

  } catch (error) {
    console.error(
      "Error marking notification as read:",
      error
    );

    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    return res.status(500).json({
      error: error.message
    });
  }
};