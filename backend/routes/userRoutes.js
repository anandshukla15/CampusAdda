const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getProfile, getUsers } = require("../controllers/userController");

router.get("/profile", auth, getProfile);
router.get("/all", auth, role("admin"), getUsers);

module.exports = router;
