const db = require("../config/db");

// User applies for president role
exports.applyForPresident = async (req, res) => {
  const { userId } = req.params;
  const { name, roll_no, college_name, document_url } = req.body;

  try {
    // Check if user already has an application
    db.query(
      "SELECT id FROM president_applications WHERE user_id = ? AND status = 'pending'",
      [userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result && result.length > 0) {
          return res.status(400).json({ error: "You already have a pending application" });
        }

        // Check if user already president
        db.query(
          "SELECT role FROM users WHERE id = ?",
          [userId],
          (err, userResult) => {
            if (err) return res.status(500).json({ error: err.message });
            if (userResult[0].role === "president") {
              return res.status(400).json({ error: "You are already a president" });
            }

            // Create or update application
            db.query(
              "INSERT INTO president_applications (user_id, name, roll_no, college_name, document_url, status) VALUES (?, ?, ?, ?, ?, 'pending') ON DUPLICATE KEY UPDATE document_url=?, status='pending'",
              [userId, name, roll_no, college_name, document_url, document_url],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({ message: "Application submitted successfully" });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all pending applications (Admin only)
exports.getPendingApplications = async (req, res) => {
  try {
    db.query(
      "SELECT pa.*, u.email FROM president_applications pa JOIN users u ON pa.user_id = u.id WHERE pa.status = 'pending' ORDER BY pa.submitted_at DESC",
      (err, result) => {
        console.error("Pending applications error:", err);
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve president application (Admin only)
exports.approveApplication = async (req, res) => {
  const { applicationId } = req.params;
  const { admin_comments } = req.body;

  try {
    db.query(
      "SELECT user_id FROM president_applications WHERE id = ?",
      [applicationId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result || result.length === 0) {
          return res.status(404).json({ error: "Application not found" });
        }

        const userId = result[0].user_id;

        // Update application status
        db.query(
          "UPDATE president_applications SET status = 'approved', admin_comments = ?, approved_at = NOW() WHERE id = ?",
          [admin_comments, applicationId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Update user role to president
            db.query(
              "UPDATE users SET role = 'president' WHERE id = ?",
              [userId],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Application approved. User role updated to president" });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject president application (Admin only)
exports.rejectApplication = async (req, res) => {
  const { applicationId } = req.params;
  const { admin_comments } = req.body;

  try {
    db.query(
      "UPDATE president_applications SET status = 'rejected', admin_comments = ? WHERE id = ?",
      [admin_comments, applicationId],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Application rejected" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get application status (User)
exports.getApplicationStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    db.query(
      "SELECT * FROM president_applications WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1",
      [userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result || result.length === 0) {
          return res.json({ status: "no_application" });
        }
        res.json(result[0]);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
