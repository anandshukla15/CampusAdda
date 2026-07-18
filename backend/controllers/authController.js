const db=require("../config/db");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

exports.register = async (req, res) => {
  let connection;

  try {
    const {
      name,
      email,
      password,
      role = "user",
      college_name,
      roll_no
    } = req.body;

    const document_url =
      req.file?.secure_url ||
      req.body.document_url ||
      req.file?.path ||
      null;

    if (!["user", "president"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role"
      });
    }

    if (role === "president") {
      if (!college_name || !roll_no) {
        return res.status(400).json({
          error: "College name and roll number are required"
        });
      }

      if (!document_url) {
        return res.status(400).json({
          error: "A PDF document is required"
        });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    connection = await db.promise().getConnection();

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO users
      (name, email, password, role, college_name, roll_no)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashed,
        role === "president" ? "user" : role,
        college_name || null,
        roll_no || null
      ]
    );

    const userId = result.insertId;

    if (role === "president") {
      await connection.query(
        `INSERT INTO president_applications
        (user_id, name, roll_no, college_name, document_url, status)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          name,
          roll_no,
          college_name,
          document_url,
          "pending"
        ]
      );
    }

    await connection.commit();

    connection.release();

    return res.status(201).json({
      message:
        role === "president"
          ? "Registered successfully. Your president application is pending admin approval."
          : "User registered successfully"
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
      connection.release();
    }

    console.error("Registration error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        error: "Email already exists"
      });
    }

    return res.status(500).json({
      error: error.message
    });
  }
};

exports.login=async(req,res)=>{
     const { email, password } = req.body;
     
  // Admin login via environment variables (centralized control)
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (adminUser && adminPass && email === adminEmail) {
    if (password !== adminPass) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET);
    return res.json({ token, role: "admin", userId: "admin" });
  }

  // Regular user login (DB)
  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result || result.length === 0) return res.status(400).json({ msg: "User not found" });

    const user = result[0];
    if (!user.password) {
  return res.status(400).json({
    msg: "Please login with Google"
  });
}

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

    res.json({ token, role: user.role, userId: user.id, name: user.name });
  });
};