import * as session from 'express-session';

export function sessionMiddleware() {
  return session({
    secret: process.env.SESSION_SECRET, // Use a strong secret in production!
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  });
}
