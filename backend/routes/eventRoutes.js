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
// Specific routes before parameter routes to avoid route conflicts
// Get events by creator
router.get("/creator/:creatorId", getEventsByCreator);

// Get saved events
router.get("/saved/all", auth, getSavedEvents);

// Save event
router.post("/:eventId/save", auth, saveEvent);

// Unsave event
router.delete("/:eventId/save", auth, unsaveEvent);

// Get event by ID
router.get("/:id", getEventById);

// Create event (Presidents and Admins only)
router.post("/create", auth, createEvent);

// Update event
router.put("/:id", auth, updateEvent);

// Delete event
router.delete("/:id", auth, deleteEvent);

module.exports = router;