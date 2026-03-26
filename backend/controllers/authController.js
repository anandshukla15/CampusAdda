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