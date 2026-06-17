const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const upload = require("../middleware/upload");
const jwt=require("jsonwebtoken");
const passport=require("passport");

router.post("/register", upload.single("document"), register);
router.post("/login", login);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);




module.exports = router;