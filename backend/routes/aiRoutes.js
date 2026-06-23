const express = require("express");
const router = express.Router();

router.get("/events", getEvents);
router.get("/events/search", searchEvents);
router.get("/activities/search", searchActivities);