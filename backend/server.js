require("dotenv").config();
const express = require("express");
const cors = require("cors");   
const authRoutes = require("./routes/authRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const presidentRoutes = require("./routes/presidentRoutes");
const eventRoutes = require("./routes/eventRoutes");

require("./config/db");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/president",presidentRoutes);
app.use("/api/events", eventRoutes);

app.get("/",(req,res)=>{
    res.send("Hello World working fine");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})