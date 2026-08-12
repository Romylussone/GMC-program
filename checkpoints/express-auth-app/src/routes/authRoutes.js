const express = require('express');
const passport = require('../config/passport');
const auth = require('../controllers/authController');

const router = express.Router();
router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }), auth.googleCallback);
router.get('/google/failure', (req, res) => res.status(401).json({ status: 'fail', message: 'Google authentication failed.' }));

module.exports = router;
