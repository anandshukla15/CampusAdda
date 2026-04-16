const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  applyPresident,
  approvePresident
} = require("../controllers/presidentController");

router.post("/apply", auth, upload.single("document"), applyPresident);
router.put("/approve/:userId", approvePresident);

module.exports = router;