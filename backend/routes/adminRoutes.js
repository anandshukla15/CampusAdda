const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const registrationController = require("../controllers/registrationController");

router.get("/dashboard", auth, role("admin"), registrationController.getAdminSummary);
router.get("/registrations", auth, role("admin"), registrationController.getAdminRegistrations);

module.exports = router;