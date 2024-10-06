// auth.js
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import config from './config.js';

// Configurar la estrategia de Discord
passport.use(new DiscordStrategy({
  clientID: config.discord.clientId,
  clientSecret: config.discord.clientSecret,
  callbackURL: config.discord.callbackURL,
  scope: ['identify', 'guilds'],
}, function(accessToken, refreshToken, profile, done) {
  // Aquí puedes guardar el usuario en la sesión o base de datos si es necesario
  done(null, profile);
}));

// Serializar el usuario en la sesión
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserializar el usuario desde la sesión
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Middleware para requerir autenticación
export const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};
