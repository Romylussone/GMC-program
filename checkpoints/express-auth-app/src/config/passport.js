const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Google account has no email address.'));
          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: email.toLowerCase() }] });
          if (!user) user = await User.create({ name: profile.displayName || 'Google User', email, googleId: profile.id });
          else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save({ validateBeforeSave: false });
          }
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

module.exports = passport;
