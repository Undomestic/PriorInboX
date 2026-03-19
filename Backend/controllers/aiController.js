/**
 * AI Controller - Endpoints for AI Features
 * Handles task extraction, importance scoring, learning, and insights
 */

const pool = require('../config/database');
const aiEngineService = require('../services/aiEngineService');

/**
 * Extract tasks from all unprocessed emails
 */
const extractTasksFromEmails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_id } = req.query;

    let query = `
      SELECT e.*, ea.provider 
      FROM emails e
      JOIN email_accounts ea ON e.email_account_id = ea.id
      WHERE e.user_id = ? AND e.has_actionable_items IS NULL
    `;
    const params = [userId];

    if (email_id) {
      query += ' AND e.id = ?';
      params.push(email_id);
    }

    query += ' LIMIT 50';

    const conn = await pool.getConnection();
    const [emails] = await conn.query(query, params);

    let totalExtracted = 0;
    const extractedTasksList = [];

    for (const email of emails) {
      const tasks = await aiEngineService.extractTasksFromEmail(email, req.user);

      for (const task of tasks) {
        const [result] = await conn.query(
          `INSERT INTO tasks 
           (user_id, title, description, priority, due_date, source_type, source_email_id, ai_confidence, status)
           VALUES (?, ?, ?, ?, ?, 'email_extraction', ?, ?, 'pending')`,
          [
            userId,
            task.title,
            `Extracted from email: "${email.subject}"`,
            task.priority,
            task.due_date,
            email.id,
            task.confidence
          ]
        );

        await conn.query(
          `INSERT INTO task_extractions 
           (user_id, email_id, task_id, extracted_text, extraction_method, confidence_score)
           VALUES (?, ?, ?, ?, 'regex', ?)`,
          [userId, email.id, result.insertId, task.title, task.confidence]
        );

        extractedTasksList.push({
          task_id: result.insertId,
          ...task
        });
        totalExtracted++;
      }

      await conn.query(
        'UPDATE emails SET has_actionable_items = ? WHERE id = ?',
        [tasks.length > 0, email.id]
      );
    }

    conn.release();

    res.json({
      success: true,
      total_extracted: totalExtracted,
      emails_processed: emails.length,
      tasks: extractedTasksList
    });
  } catch (error) {
    console.error('Task extraction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Classify email importance for a specific email
 */
const classifyEmailImportance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_id } = req.body;

    const conn = await pool.getConnection();
    const [emails] = await conn.query(
      'SELECT * FROM emails WHERE id = ? AND user_id = ?',
      [email_id, userId]
    );

    if (emails.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const email = emails[0];
    const importance = await aiEngineService.classifyEmailImportance(email, req.user);

    await conn.query(
      'UPDATE emails SET importance_score = ?, is_important = ? WHERE id = ?',
      [importance.importance_score, importance.is_important, email_id]
    );

    conn.release();

    res.json({
      success: true,
      email_id,
      importance_score: importance.importance_score,
      is_important: importance.is_important,
      factors: importance.factors
    });
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user's learning profile
 */
const getLearningProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const conn = await pool.getConnection();
    const [profile] = await conn.query(
      'SELECT * FROM ai_learning_data WHERE user_id = ?',
      [userId]
    );

    if (profile.length === 0) {
      conn.release();
      return res.json({
        success: true,
        profile: {
          user_id: userId,
          emails_marked_important: 0,
          avg_task_completion_rate: 0,
          peak_work_hours: [9, 10, 14, 15]
        }
      });
    }

    conn.release();

    res.json({
      success: true,
      profile: profile[0]
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get productivity score and insights
 */
const getProductivityScore = async (req, res) => {
  try {
    const userId = req.user.id;

    const conn = await pool.getConnection();

    const [allTasks] = await conn.query(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ?',
      [userId]
    );

    const [completedTasks] = await conn.query(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "completed"',
      [userId]
    );

    const [overdueTasks] = await conn.query(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "pending" AND due_date < CURDATE()',
      [userId]
    );

    const [todayCompleted] = await conn.query(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "completed" AND DATE(completed_at) = CURDATE()',
      [userId]
    );

    conn.release();

    const totalTasks = allTasks[0].count;
    const completedCount = completedTasks[0].count;
    const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

    const scoreComponents = {
      completion_rate: completionRate,
      on_time_tasks: Math.max(0, 100 - (overdueTasks[0].count * 10)),
      daily_activity: Math.min(todayCompleted[0].count * 20, 100)
    };

    const productivityScore = (
      (scoreComponents.completion_rate * 0.4) +
      (scoreComponents.on_time_tasks * 0.3) +
      (scoreComponents.daily_activity * 0.3)
    );

    res.json({
      success: true,
      productivity_score: Math.round(productivityScore),
      metrics: {
        total_tasks: totalTasks,
        completed_tasks: completedCount,
        completion_rate: Math.round(completionRate),
        overdue_tasks: overdueTasks[0].count,
        completed_today: todayCompleted[0].count
      },
      rating: productivityScore > 80 ? 'Excellent' : 
              productivityScore > 60 ? 'Good' :
              productivityScore > 40 ? 'Fair' : 'Needs Improvement'
    });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Log user feedback for AI improvement
 */
const submitAIFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { task_id, email_id, feedback_type, is_accurate } = req.body;

    const conn = await pool.getConnection();

    await conn.query(
      `INSERT INTO ai_predictions (user_id, task_id, email_id, prediction_type, accuracy_feedback)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, task_id, email_id, feedback_type, is_accurate]
    );

    if (feedback_type === 'importance' && email_id) {
      const important = is_accurate ? true : false;
      await conn.query(
        'UPDATE emails SET is_important = ?, user_labeled = TRUE WHERE id = ?',
        [important, email_id]
      );

      await aiEngineService.updateLearningProfile(userId, 'email_marked_important', {});
    }

    conn.release();

    res.json({
      success: true,
      message: 'Feedback recorded. AI model will improve over time.'
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get daily productivity summary
 */
const getDailySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await aiEngineService.generateProductivitySummary(userId);

    if (!summary) {
      return res.status(500).json({ success: false, message: 'Error generating summary' });
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Predict task completion date
 */
const predictTaskCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { task_id } = req.query;

    const conn = await pool.getConnection();

    const [tasks] = await conn.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [task_id, userId]
    );

    if (tasks.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = tasks[0];

    const [completionStats] = await conn.query(`
      SELECT 
        AVG(DATEDIFF(completed_at, created_at)) as avg_days
      FROM tasks 
      WHERE user_id = ? AND status = 'completed'
    `, [userId]);

    conn.release();

    const avgDays = completionStats[0]?.avg_days || 3;
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + Math.round(avgDays));

    res.json({
      success: true,
      task_id,
      predicted_completion_date: predictedDate,
      confidence: 0.65,
      reasoning: `Based on your average completion time of ${Math.round(avgDays)} days`
    });
  } catch (error) {
    console.error('Error predicting completion:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Intelligently analyze all emails and mark important ones
 */
const analyzeAndMarkImportantEmails = async (req, res) => {
  try {
    const userId = req.user.id;
    const emailAIService = require('../services/emailAIService');

    // Get all unanalyzed emails
    const conn = await pool.getConnection();
    const [emails] = await conn.query(
      `SELECT id, subject, body, from_address, is_important, created_at 
       FROM emails 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userId]
    );

    let analyzed = 0;
    let marked = 0;
    const analysis = [];

    for (const email of emails) {
      try {
        // Get importance score
        const score = emailAIService.getImportanceScore(email.subject, email.body, email.from_address);
        const shouldMark = score >= 30;

        // Update if importance status changed
        if (email.is_important !== shouldMark) {
          await conn.query(
            'UPDATE emails SET is_important = ? WHERE id = ?',
            [shouldMark, email.id]
          );
          
          if (shouldMark) {
            marked++;
          }
        }

        analyzed++;

        analysis.push({
          id: email.id,
          subject: email.subject,
          from: email.from_address,
          score: score,
          marked: shouldMark,
          status: shouldMark ? 'marked_important' : 'not_important'
        });
      } catch (error) {
        console.error('Error analyzing email:', error);
      }
    }

    conn.release();

    res.json({
      success: true,
      analyzed: analyzed,
      marked: marked,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error in email analysis:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get AI insights about important emails
 */
const getEmailInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    const conn = await pool.getConnection();

    // Get statistics about important emails
    const [stats] = await conn.query(
      `SELECT 
        COUNT(*) as total_emails,
        SUM(CASE WHEN is_important = true THEN 1 ELSE 0 END) as important_count,
        COUNT(DISTINCT from_address) as unique_senders
       FROM emails 
       WHERE user_id = ?`,
      [userId]
    );

    // Get top senders by importance
    const [topSenders] = await conn.query(
      `SELECT 
        from_address,
        COUNT(*) as email_count,
        SUM(CASE WHEN is_important = true THEN 1 ELSE 0 END) as important_count,
        ROUND(SUM(CASE WHEN is_important = true THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as importance_percentage
       FROM emails 
       WHERE user_id = ?
       GROUP BY from_address
       ORDER BY importance_percentage DESC
       LIMIT 10`,
      [userId]
    );

    // Get important emails by category
    const [byCategory] = await conn.query(
      `SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN is_important = true THEN 1 ELSE 0 END) as important_count
       FROM emails 
       WHERE user_id = ?
       GROUP BY category`,
      [userId]
    );

    conn.release();

    res.json({
      success: true,
      statistics: {
        total_emails: stats[0]?.total_emails || 0,
        important_emails: stats[0]?.important_count || 0,
        importance_rate: stats[0]?.total_emails > 0 ? 
          Math.round((stats[0]?.important_count / stats[0]?.total_emails) * 100) : 0,
        unique_senders: stats[0]?.unique_senders || 0
      },
      top_important_senders: topSenders,
      by_category: byCategory
    });
  } catch (error) {
    console.error('Error getting email insights:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get AI suggestions for email organization
 */
const getEmailOrganizationSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const conn = await pool.getConnection();

    // Get emails that might be marked important but aren't
    const [missedImportant] = await conn.query(
      `SELECT id, subject, from_address, body, created_at
       FROM emails
       WHERE user_id = ? 
       AND is_important = false
       AND (
         subject LIKE '%urgent%' OR subject LIKE '%important%' OR subject LIKE '%deadline%' OR
         body LIKE '%urgent%' OR body LIKE '%critical%' OR body LIKE '%action required%'
       )
       LIMIT 10`,
      [userId]
    );

    // Get frequently marked important senders
    const [frequentSenders] = await conn.query(
      `SELECT 
        from_address,
        COUNT(*) as email_count,
        SUM(CASE WHEN is_important = true THEN 1 ELSE 0 END) as important_count
       FROM emails 
       WHERE user_id = ?
       AND is_important = true
       GROUP BY from_address
       HAVING important_count > 1
       ORDER BY important_count DESC
       LIMIT 5`,
      [userId]
    );

    conn.release();

    const suggestions = [];

    if (missedImportant.length > 0) {
      suggestions.push({
        type: 'missed_important',
        title: 'Potentially Important Emails Not Marked',
        count: missedImportant.length,
        description: `Found ${missedImportant.length} emails with important keywords that aren't marked as important`,
        items: missedImportant.map(e => ({
          id: e.id,
          subject: e.subject,
          from: e.from_address
        }))
      });
    }

    if (frequentSenders.length > 0) {
      const sendersList = frequentSenders.map(s => s.from_address).join(', ');
      suggestions.push({
        type: 'frequent_important_senders',
        title: 'Frequent Important Senders',
        description: `These senders frequently send you important emails: ${sendersList}`,
        items: frequentSenders
      });
    }

    res.json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  extractTasksFromEmails,
  classifyEmailImportance,
  getLearningProfile,
  getProductivityScore,
  submitAIFeedback,
  getDailySummary,
  predictTaskCompletion,
  analyzeAndMarkImportantEmails,
  getEmailInsights,
  getEmailOrganizationSuggestions
};
