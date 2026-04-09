const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createEvent,
  getEvents,
  approveEvent
} = require("../controllers/eventController");

router.post("/", auth, createEvent);
router.get("/", getEvents);
router.put("/approve/:id", approveEvent);

module.exports = router;