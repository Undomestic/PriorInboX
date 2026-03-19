const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { verifyToken } = require('../middleware/auth');

// All calendar routes require authentication
router.use(verifyToken);

router.get('/', calendarController.getEvents);
router.post('/', calendarController.createEvent);
router.put('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);

module.exports = router;
