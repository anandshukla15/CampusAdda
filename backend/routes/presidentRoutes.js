const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  applyForPresident,
  getPendingApplications,
  approveApplication,
  rejectApplication,
  getApplicationStatus,
  getAllPresidents,
  removePresident
} = require("../controllers/presidentApplicationController");

// User applies for president
router.post("/apply/:userId", auth, applyForPresident);

// Get application status
router.get("/status/:userId", auth, getApplicationStatus);

// Admin gets all pending applications
router.get("/applications/pending", auth, role("admin"), getPendingApplications);

// Admin approves application
router.put("/approve/:applicationId", auth, role("admin"), approveApplication);

// Admin rejects application
router.put("/reject/:applicationId", auth, role("admin"), rejectApplication);

// Admin gets all current presidents
router.get("/all", auth, role("admin"), getAllPresidents);

// Admin removes a president (demotes to user)
router.put("/:userId/remove", auth, role("admin"), removePresident);

module.exports = router;