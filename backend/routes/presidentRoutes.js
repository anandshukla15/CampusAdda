const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const {
  applyPresident,
  getPresidentRequests,
  approvePresident
} = require("../controllers/presidentController");

router.post("/apply", auth, upload.single("document"), applyPresident);
router.get("/requests", auth, role("admin"), getPresidentRequests);
router.put("/approve/:userId", auth, role("admin"), approvePresident);

module.exports = router;