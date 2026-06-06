const db=require("../config/db");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
    [name, email, hashed, "user"],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "User registered successfully" });
    }
  );
};

exports.login=async(req,res)=>{
     const { email, password } = req.body;
  // Admin login via environment variables (centralized control)
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (adminUser && adminPass && email === adminUser) {
    if (password !== adminPass) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET);
    return res.json({ token });
  }

  // Regular user login (DB)
  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result || result.length === 0) return res.status(400).json({ msg: "User not found" });

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

    res.json({ token });
  });
};