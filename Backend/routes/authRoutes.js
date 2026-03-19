const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }),
  (req, res) => {
    try {
      // Generate JWT token after successful Google authentication
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      console.log('✅ OAuth callback successful for user:', req.user.email);
      // Redirect to frontend with token
      res.redirect(`http://localhost:8000/oauth-success?token=${token}&user=${JSON.stringify(req.user)}`);
    } catch (error) {
      console.error('❌ OAuth callback error:', error.message);
      res.status(500).json({ message: 'OAuth callback error', error: error.message });
    }
  }
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({ message: 'Google OAuth failed' });
});

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);
router.post('/update-profile', verifyToken, authController.updateProfile);
router.post('/change-password', verifyToken, authController.changePassword);
router.delete('/delete-account', verifyToken, authController.deleteAccount);

// Timezone routes
router.post('/timezone', verifyToken, authController.updateTimezone);
router.get('/timezone', verifyToken, authController.getTimezone);

module.exports = router;
