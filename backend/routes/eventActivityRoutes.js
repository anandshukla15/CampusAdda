const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createActivity,
  getActivitiesByEvent,
  updateActivity,
  deleteActivity,
  updateRegistrationStatus
} = require("../controllers/eventActivityController");

router.post("/", auth, createActivity);
router.get("/:eventId", getActivitiesByEvent);
router.put("/:id", auth, updateActivity);
router.patch("/:id/registration-status", auth, updateRegistrationStatus);
router.delete("/:id", auth, deleteActivity);

module.exports = router;
