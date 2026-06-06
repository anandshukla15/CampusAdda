const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  getPendingEvents,
  approveEvent
} = require("../controllers/eventController");

router.post("/", auth, role(["president", "admin"]), createEvent);
router.get("/", getEvents);
router.get("/my", auth, role(["president", "admin"]), getMyEvents);
router.get("/pending", auth, role("admin"), getPendingEvents);
router.get("/:id", getEventById);
router.put("/approve/:id", auth, role("admin"), approveEvent);

module.exports = router;