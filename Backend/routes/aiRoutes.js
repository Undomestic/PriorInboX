/**
 * AI Routes - Intelligent features API endpoints
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

// All AI routes require authentication
router.use(verifyToken);

// Task extraction
router.post('/extract-tasks', aiController.extractTasksFromEmails);
router.post('/classify-importance', aiController.classifyEmailImportance);

// Learning & insights
router.get('/learning-profile', aiController.getLearningProfile);
router.get('/productivity-score', aiController.getProductivityScore);
router.get('/daily-summary', aiController.getDailySummary);

// Predictions
router.get('/predict-completion', aiController.predictTaskCompletion);

// Feedback
router.post('/feedback', aiController.submitAIFeedback);

// Intelligent Email Analysis
router.post('/analyze-emails', aiController.analyzeAndMarkImportantEmails);
router.get('/email-insights', aiController.getEmailInsights);
router.get('/email-suggestions', aiController.getEmailOrganizationSuggestions);

module.exports = router;
