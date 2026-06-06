const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByCreator,
  saveEvent,
  unsaveEvent,
  getSavedEvents
} = require("../controllers/eventController");

// Get all events
router.get("/", getAllEvents);

// Get event by ID
router.get("/:id", getEventById);

// Create event (Presidents and Admins only)
router.post("/", auth, createEvent);

// Update event
router.put("/:id", auth, updateEvent);

// Delete event
router.delete("/:id", auth, deleteEvent);

// Get events by creator
router.get("/creator/:creatorId", getEventsByCreator);

// Save event
router.post("/:eventId/save", auth, saveEvent);

// Unsave event
router.delete("/:eventId/save", auth, unsaveEvent);

// Get saved events
router.get("/saved/all", auth, getSavedEvents);

module.exports = router;