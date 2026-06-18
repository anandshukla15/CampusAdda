// backend/config/passport.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;

      db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        (err, result) => {
          if (err) return done(err);

          if (result.length > 0) {
            return done(null, result[0]);
          }

          db.query(
  "INSERT INTO users(name,email,password,role,provider) VALUES(?,?,?,?,?)",
  [
    profile.displayName,
    email,
    null,
    "user",
    "google"
  ],
            (err, res) => {
              if (err) return done(err);

              done(null, {
                id: res.insertId,
                name: profile.displayName,
                email,
                role: "user",
              });
            }
          );
        }
      );
    }
  )
);

module.exports = passport;