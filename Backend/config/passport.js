const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const conn = await pool.getConnection();
      
      // Check if user already exists
      const [existingUser] = await conn.query(
        'SELECT * FROM users WHERE google_id = ?',
        [profile.id]
      );

      if (existingUser.length > 0) {
        conn.release();
        return done(null, existingUser[0]);
      }

      // Create new user with Google profile
      const email = profile.emails[0].value;
      const [result] = await conn.query(
        'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)',
        [profile.displayName || profile.id, email, profile.id]
      );

      const newUser = {
        id: result.insertId,
        username: profile.displayName || profile.id,
        email: email,
        google_id: profile.id
      };

      conn.release();
      return done(null, newUser);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const conn = await pool.getConnection();
    const [user] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    conn.release();
    done(null, user[0]);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
