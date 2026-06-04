require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

const authRoutes = require("./routes/authRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const presidentRoutes = require("./routes/presidentRoutes");
const eventRoutes = require("./routes/eventRoutes");

require("./config/db");

const socketConfig = require("./config/socket");
const chatSocket = require("./sockets/chatSocket");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/president", presidentRoutes);
app.use("/api/events", eventRoutes);

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