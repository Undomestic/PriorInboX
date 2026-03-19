const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/auth');

// All task routes require authentication
router.use(verifyToken);

// Task retrieval
router.get('/', taskController.getTasks);
router.get('/active', taskController.getActiveTasks);

// Task CRUD operations
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.put('/:id/complete', taskController.completeTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
