const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getProfile, getUsers, deleteUser, updateUserRole } = require("../controllers/userController");

router.get("/profile", auth, getProfile);
router.get("/all", auth, role("admin"), getUsers);

// Admin: delete user
router.delete("/:userId", auth, role("admin"), deleteUser);

// Admin: update user role (e.g., remove president)
router.put("/:userId/role", auth, role("admin"), updateUserRole);

module.exports = router;
