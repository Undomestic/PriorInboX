const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { verifyToken } = require('../middleware/auth');

// All email routes require authentication
router.use(verifyToken);

// Email retrieval and filtering
router.get('/', emailController.getEmails);
router.get('/important', emailController.getImportantEmails);
router.get('/category/:category', emailController.getEmailsByCategory);

// Email actions
router.put('/:emailId/important', emailController.markAsImportant);
router.put('/:emailId/read', emailController.markAsRead);
router.put('/:emailId/archive', emailController.archiveEmail);
router.post('/:emailId/create-task', emailController.createTaskFromEmail);

module.exports = router;
