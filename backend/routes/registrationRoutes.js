const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const registrationController = require("../controllers/registrationController");

router.post("/", auth, registrationController.create);
router.get("/my", auth, registrationController.getMyRegistrations);
router.get("/:id", auth, registrationController.getRegistration);
router.delete("/:id", auth, registrationController.removeRegistration);

module.exports = router;