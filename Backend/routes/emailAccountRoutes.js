const express = require('express');
const router = express.Router();
const emailAccountController = require('../controllers/emailAccountController');
const { verifyToken } = require('../middleware/auth');

// OAuth endpoints
// /authorize requires auth to establish session context
router.get('/oauth/authorize', verifyToken, emailAccountController.getAuthorizationUrl);

// /callback doesn't require auth in header since it comes from OAuth provider redirect
// The state token in session provides CSRF protection and userId context
router.get('/oauth/callback/:provider', emailAccountController.oauthCallback);

// All other email account routes require authentication
router.use(verifyToken);

router.get('/', emailAccountController.getEmailAccounts);
router.get('/stats', emailAccountController.getEmailStats);
router.post('/', emailAccountController.connectEmailAccount);
router.post('/:accountId/refresh', emailAccountController.refreshToken);
router.post('/:accountId/sync', emailAccountController.syncEmails);
router.delete('/:accountId', emailAccountController.disconnectEmailAccount);

module.exports = router;
