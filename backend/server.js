require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
const passport = require("passport");


const authRoutes = require("./routes/authRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const presidentRoutes = require("./routes/presidentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const eventActivityRoutes = require("./routes/eventActivityRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");

require("./config/db");
require("./config/passport");

const socketConfig = require("./config/socket");
const chatSocket = require("./sockets/chatSocket");


const app = express();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// app.use(cors());
const allowedOrigins = [
  "http://localhost:3000",
  "https://campus-adda-azure.vercel.app/",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/president", presidentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/event-activities", eventActivityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

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
