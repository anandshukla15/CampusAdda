const db = require("../config/db");

exports.addCollege = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "College name is required"
      });
    }

    await db.query(
      "INSERT INTO colleges (name) VALUES (?)",
      [name]
    );

    res.json({
      msg: "College added"
    });

  } catch (err) {
    console.error("Add college error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};


exports.getColleges = async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT id, name, created_at FROM colleges"
    );

    res.json(result);

  } catch (err) {
    console.error("Get colleges error:", err);

    res.status(500).json({
      error: err.message
    });
  }
};