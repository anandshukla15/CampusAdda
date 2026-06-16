require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");


const authRoutes = require("./routes/authRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const presidentRoutes = require("./routes/presidentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

require("./config/db");

const socketConfig = require("./config/socket");
const chatSocket = require("./sockets/chatSocket");

const app = express();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/president", presidentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Hello World working fine");
});


// IMPORTANT: create http server
const server = http.createServer(app);

// initialize socket
const io = socketConfig.init(server);

// call socket logic
chatSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});