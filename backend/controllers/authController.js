const db=require("../config/db");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password, role = "user", college_name, roll_no } = req.body;
  const document_url = req.file
    ? `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`
    : null;
  
  // Validate role
  if (!["user", "president"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Only 'user' and 'president' allowed during registration" });
  }

  if (role === "president") {
    if (!college_name || !roll_no) {
      return res.status(400).json({ error: "College name and roll number are required for president registration" });
    }
    if (!document_url) {
      return res.status(400).json({ error: "A PDF document is required for president registration" });
    }
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    
    db.query(
      "INSERT INTO users(name,email,password,role,college_name,roll_no) VALUES(?,?,?,?,?,?)",
      [name, email, hashed, role === "president" ? "user" : role, college_name || null, roll_no || null],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email already exists" });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const userId = result.insertId;

        //console.log(`User registered with ID: ${userId} and role: ${role}`);
        if (role === "president") {
          db.query(
            "INSERT INTO president_applications(user_id,name,roll_no,college_name,document_url,status) VALUES(?,?,?,?,?,?)",
            [userId, name, roll_no, college_name, document_url, "pending"],
            (err) => {
              if (err) {
                console.error("Failed to save president application:", err);
                return res.status(500).json({ error: err.message });
              }
              res.status(201).json({ 
                message: "Registered successfully. Your president application is pending admin approval." 
              });
            }
          );
        } else {
          res.status(201).json({ message: "User registered successfully" });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

    res.json({ token, role: user.role, userId: user.id, name: user.name });
  });
};