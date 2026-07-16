const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { upload, uploadDocumentToCloudinary } = require("../middleware/upload");
const jwt=require("jsonwebtoken");
const passport=require("passport");

router.post("/register", upload.single("document"), uploadDocumentToCloudinary, register);
router.post("/login", login);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.id,
        role: req.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(
      `https://campus-adda-azure.vercel.app/oauth-success?token=${token}`
    );
  }
);


module.exports = router;