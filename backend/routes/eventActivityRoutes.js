const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createActivity,
  getActivitiesByEvent,
  updateActivity,
  deleteActivity
} = require("../controllers/eventActivityController");

router.post("/", auth, createActivity);
router.get("/:eventId", getActivitiesByEvent);
router.put("/:id", auth, updateActivity);
router.delete("/:id", auth, deleteActivity);

module.exports = router;
