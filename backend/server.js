require("dotenv").config();
const express = require("express");
const cors = require("cors");   

require("./config/db");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World working fine");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})