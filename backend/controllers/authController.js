const db=require("../config/db");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

exports.register=async(req,res)=>{
    const {name,email,password}=req.body;
    const hashed=await bcrypt.hash(password,10);
    db.query("INSERT INTO users(name,email,password) VALUES(?,?,?)",[name,email,hashed],(err,result)=>{
        if(err){
            res.status(500).json({error:err.message});
        }else{
            res.status(201).json({message:"User registered successfully"});
        }
    });
};

exports.login=async(req,res)=>{
     const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
    if (result.length === 0) return res.status(400).json({ msg: "User not found" });

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({ token });
  });
};