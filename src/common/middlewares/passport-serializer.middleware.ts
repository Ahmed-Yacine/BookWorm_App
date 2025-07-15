import * as passport from 'passport';

export function passportSerializerMiddleware() {
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    // Only store essential user data in session
    const sessionUser = {
      id: user.id || user.email, // Use email as fallback if id doesn't exist
      email: user.email,
    };
    done(null, sessionUser);
  });

  // Deserialize user from session
  passport.deserializeUser((sessionUser: any, done) => {
    // Return the session user data
    done(null, sessionUser);
  });
}
