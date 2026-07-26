const db = require("../config/db");

exports.applyPresident = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, roll_no, college_name } = req.body;

    const document_url = req.file
      ? (req.file.secure_url || req.file.path)
      : req.body.document_url || null;

    if (!name || !roll_no || !college_name) {
      return res.status(400).json({
        error: "name, roll_no and college_name are required"
      });
    }

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

    return res.json({
      msg: "President application submitted"
    });

  } catch (err) {
    console.error("Apply president error:", err);

    return res.status(500).json({
      error: err.message
    });
  }
};

exports.getPresidentRequests = async (req, res) => {
  try {
    const [result] = await db.query(
      `SELECT
        pa.id,
        pa.user_id,
        pa.name,
        pa.roll_no,
        pa.college_name,
        pa.document_url,
        u.email
       FROM president_applications pa
       JOIN users u
         ON pa.user_id = u.id
       WHERE pa.status = 'pending'
       ORDER BY pa.submitted_at DESC`
    );

    return res.json(result);

  } catch (err) {
    console.error("Get president requests error:", err);

    return res.status(500).json({
      error: err.message
    });
  }
};