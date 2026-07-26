const db = require("../config/db");
const socketConfig = require("../config/socket");

// User applies for president role
exports.applyForPresident = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    roll_no,
    college_name,
    document_url
  } = req.body;

  try {
    // Check pending application
    const [existingApplication] = await db.query(
      `SELECT id
       FROM president_applications
       WHERE user_id = ?
       AND status = 'pending'`,
      [userId]
    );

    if (existingApplication.length > 0) {
      return res.status(400).json({
        error: "You already have a pending application"
      });
    }

    // Check user's current role
    const [userResult] = await db.query(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (userResult[0].role === "president") {
      return res.status(400).json({
        error: "You are already a president"
      });
    }

    // Create or update application
    await db.query(
      `INSERT INTO president_applications
       (user_id, name, roll_no, college_name, document_url, status)
       VALUES (?, ?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE
       document_url = ?,
       status = 'pending'`,
      [
        userId,
        name,
        roll_no,
        college_name,
        document_url,
        document_url
      ]
    );

    // Create admin notification
    const message =
      `${name} applied for president (${college_name})`;

    const data = JSON.stringify({
      userId,
      name,
      college_name
    });

    try {
      await db.query(
        `INSERT INTO notifications
         (
           recipient_user_id,
           recipient_role,
           type,
           message,
           data
         )
         VALUES (NULL, 'admin', 'president_application', ?, ?)`,
        [message, data]
      );
    } catch (notificationError) {
      console.error(
        "Failed to create admin notification:",
        notificationError.message
      );
    }

    // Emit socket notification
    try {
      const io = socketConfig.getIO();

      io.to("role_admin").emit(
        "notification",
        {
          type: "president_application",
          message,
          data: {
            userId,
            name,
            college_name
          }
        }
      );

    } catch (socketError) {
      console.error(
        "Socket emit error:",
        socketError.message
      );
    }

    return res.status(200).json({
      message: "Application submitted successfully"
    });

  } catch (error) {
    console.error("Apply president error:", error);

    return res.status(500).json({
      error: error.message
    });
  }
};

// Get all pending applications (Admin only)
exports.getPendingApplications = async (req, res) => {
  try {
    const [result] = await db.query(
      `SELECT
        pa.*,
        u.email
       FROM president_applications pa
       JOIN users u
         ON pa.user_id = u.id
       WHERE pa.status = 'pending'
       ORDER BY pa.submitted_at DESC`
    );

    return res.json(result);

  } catch (error) {
    console.error(
      "Pending applications error:",
      error
    );

    return res.status(500).json({
      error: error.message
    });
  }
};

// Approve president application (Admin only)
exports.approveApplication = async (req, res) => {
  const { applicationId } = req.params;
  const { admin_comments } = req.body;

  let connection;

  try {
    // Get a connection from the promise-based pool
    connection = await db.getConnection();

    await connection.beginTransaction();

    // 1. Get user ID
    const [applications] = await connection.query(
      `SELECT user_id
       FROM president_applications
       WHERE id = ?`,
      [applicationId]
    );

    if (applications.length === 0) {
      await connection.rollback();
      connection.release();

      return res.status(404).json({
        error: "Application not found"
      });
    }

    const userId = applications[0].user_id;

    // 2. Update application
    await connection.query(
      `UPDATE president_applications
       SET status = 'approved',
           admin_comments = ?,
           approved_at = NOW()
       WHERE id = ?`,
      [admin_comments || null, applicationId]
    );

    // 3. Update user role
    await connection.query(
      `UPDATE users
       SET role = 'president'
       WHERE id = ?`,
      [userId]
    );

    // 4. Create notification
    const message =
      "Your application to become president has been approved";

    const data = JSON.stringify({
      userId
    });

    await connection.query(
      `INSERT INTO notifications
       (
         recipient_user_id,
         recipient_role,
         type,
         message,
         data
       )
       VALUES (?, NULL, 'president_approved', ?, ?)`,
      [userId, message, data]
    );

    // Commit all database changes
    await connection.commit();

    connection.release();

    // 5. Emit socket notification
    try {
      const io = socketConfig.getIO();

      io.to(`user_${userId}`).emit(
        "notification",
        {
          type: "president_approved",
          message,
          data: {
            userId
          }
        }
      );

    } catch (socketError) {
      console.error(
        "Socket emit error:",
        socketError.message
      );
    }

    return res.json({
      message:
        "Application approved. User role updated to president"
    });

  } catch (error) {

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError.message
        );
      }

      connection.release();
    }

    console.error(
      "Approve application error:",
      error
    );

    return res.status(500).json({
      error: error.message
    });
  }
};
// Reject president application (Admin only)
exports.rejectApplication = async (req, res) => {
  const { applicationId } = req.params;
  const { admin_comments } = req.body;

  try {
    await db.query(
      `UPDATE president_applications
       SET status = ?,
           admin_comments = ?
       WHERE id = ?`,
      [
        "rejected",
        admin_comments,
        applicationId
      ]
    );

    return res.json({
      message: "Application rejected"
    });

  } catch (error) {
    console.error(
      "Reject application error:",
      error
    );

    return res.status(500).json({
      error: error.message
    });
  }
};

// Get application status (User)
exports.getApplicationStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    const [result] = await db.query(
      `SELECT *
       FROM president_applications
       WHERE user_id = ?
       ORDER BY submitted_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!result || result.length === 0) {
      return res.json({
        status: "no_application"
      });
    }

    return res.json(result[0]);

  } catch (error) {
    console.error(
      "Get application status error:",
      error
    );

    return res.status(500).json({
      error: error.message
    });
  }
};

// Get all current presidents (Admin only)
exports.getAllPresidents = async (req, res) => {
  try {
    const [result] = await db.query(
      `SELECT
        id,
        name,
        email,
        college_name,
        created_at
       FROM users
       WHERE role = 'president'
       ORDER BY created_at DESC`
    );

    return res.json(result);

  } catch (error) {
    console.error(
      "Get all presidents error:",
      error
    );

    return res.status(500).json({
      error: error.message
    });
  }
};

// Remove a president and make them a regular user (Admin only)
exports.removePresident = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if user exists and is a president
    const [result] = await db.query(
      `SELECT id, name, email
       FROM users
       WHERE id = ?
       AND role = 'president'`,
      [userId]
    );

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: "President not found"
      });
    }

    const presidentName = result[0].name;

    // Update user role
    await db.query(
      "UPDATE users SET role = 'user' WHERE id = ?",
      [userId]
    );

    const message =
      "Your president role has been revoked by an admin. You are now a regular user.";

    const data = JSON.stringify({
      userId
    });

    // Create notification
    try {
      await db.query(
        `INSERT INTO notifications
         (
           recipient_user_id,
           recipient_role,
           type,
           message,
           data
         )
         VALUES (?, NULL, 'president_removed', ?, ?)`,
        [userId, message, data]
      );
    } catch (notificationError) {
      console.error(
        "Failed to create removal notification:",
        notificationError.message
      );
    }

    // Emit socket notification
    try {
      const io = socketConfig.getIO();

      io.to(`user_${userId}`).emit(
        "notification",
        {
          type: "president_removed",
          message,
          data: {
            userId
          }
        }
      );

    } catch (socketError) {
      console.error(
        "Socket emit error:",
        socketError.message
      );
    }

    return res.json({
      message: `${presidentName} has been removed from president role and is now a regular user`
    });

  } catch (error) {
    console.error(
      "Remove president error:",
      error
    );

    return res.status(500).json({
      error: error.message
    });
  }
};