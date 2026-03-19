/**
 * AI Engine Service - Email Intelligence & Task Extraction
 * Handles importance scoring, task extraction, priority learning
 */

const axios = require('axios');
const pool = require('../config/database');

class AIEngineService {
  /**
   * PHASE 1: Classify email importance (Keyword + ML)
   * Scores from 0-1, where 1 is most important
   */
  async classifyEmailImportance(email, user) {
    try {
      const {
        subject = '',
        from_email = '',
        from_name = '',
        body_text = ''
      } = email;

      // Get user's learning profile
      const userProfile = await this.getUserLearningProfile(user.id);

      // Multi-factor scoring
      const senderScore = this.calculateSenderScore(from_email, from_name, userProfile);
      const subjectScore = this.calculateSubjectScore(subject);
      const contentScore = this.calculateContentScore(body_text);
      const historyScore = userProfile.emails_marked_important > 10 ? 0.3 : 0;

      // Weighted formula
      const importance = (
        senderScore * 0.30 +
        subjectScore * 0.25 +
        contentScore * 0.25 +
        historyScore * 0.20
      );

      return {
        importance_score: Math.min(importance, 1),
        is_important: importance > 0.6,
        factors: {
          sender: senderScore,
          subject: subjectScore,
          content: contentScore,
          history: historyScore
        }
      };
    } catch (error) {
      console.error('Email importance classification error:', error);
      return { importance_score: 0.5, is_important: false };
    }
  }

  /**
   * Calculate importance based on sender
   */
  calculateSenderScore(email, name, userProfile) {
    const urgencyKeywords = ['boss', 'manager', 'director', 'ceo', 'important person'];
    const vipDomains = ['company.com', 'boss', 'executive'];

    let score = 0.3; // Base score

    // Check if sender is from company domain
    if (email.includes('@company.com') || email.includes('@boss')) {
      score += 0.2;
    }

    // Check name for VIP patterns
    const lowerName = name.toLowerCase();
    if (urgencyKeywords.some(keyword => lowerName.includes(keyword))) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate importance from subject line
   */
  calculateSubjectScore(subject) {
    const urgentKeywords = [
      'urgent', 'asap', 'critical', 'important',
      'action required', 'deadline', 'emergency',
      'alert', 'urgent action', 'high priority'
    ];

    let score = 0;
    const lowerSubject = subject.toLowerCase();

    // Check for urgent keywords
    if (urgentKeywords.some(keyword => lowerSubject.includes(keyword))) {
      score += 0.4;
    }

    // Check for multiple exclamation marks or all caps
    if ((subject.match(/!/g) || []).length > 1 || subject === subject.toUpperCase()) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate importance from email content
   */
  calculateContentScore(body) {
    const actionKeywords = [
      'review', 'approve', 'sign', 'submit',
      'respond', 'call me', 'urgent action',
      'need help', 'feedback required'
    ];

    let score = 0;
    const lowerBody = body.toLowerCase();

    // Action items
    if (actionKeywords.some(keyword => lowerBody.includes(keyword))) {
      score += 0.3;
    }

    // Urgency markers
    if (lowerBody.includes('asap') || lowerBody.includes('eod') || lowerBody.includes('urgent')) {
      score += 0.3;
    }

    // Deadline mentions
    if (/\b(deadline|due|by|before|until)\b/i.test(body)) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * PHASE 2: Extract tasks from email
   */
  async extractTasksFromEmail(email, user) {
    try {
      const { subject, body_text, received_at } = email;
      const extractedTasks = [];

      // Pattern 1: Direct action patterns
      const actionPattern = /(?:^|\s)(?:can|could|please|would you|need to|must|should)\s+(review|send|approve|check|call|confirm|sign|submit|fix|update|create|delete|reply|respond|forward)\s+(?:the\s+)?(.+?)(?:\s*\?|by\s|until\s|eod|today|tomorrow|this week|next week|,|\.|\n|$)/gi;

      let match;
      while ((match = actionPattern.exec(body_text)) !== null) {
        const action = match[2].toLowerCase();
        const object = match[3].trim();
        const dueDate = this.extractDueDate(body_text, match.index);

        extractedTasks.push({
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${object}`,
          action,
          object,
          due_date: dueDate,
          priority: this.calculateTaskPriority(match[0], subject),
          confidence: 0.75,
          source: 'email'
        });
      }

      // Pattern 2: Deadline-based
      const deadlinePattern = /(?:deadline|due|by|before|until|submit by)\s+(.+?)(?:\s|,|\.|\n|$)/gi;
      while ((match = deadlinePattern.exec(body_text)) !== null) {
        const deadline = match[1].trim();
        const dueDate = this.parseDateExpression(deadline);

        if (dueDate) {
          extractedTasks.push({
            title: `Complete task for deadline: ${deadline}`,
            action: 'complete',
            object: deadline,
            due_date: dueDate,
            priority: 'high',
            confidence: 0.60,
            source: 'deadline'
          });
        }
      }

      return extractedTasks;
    } catch (error) {
      console.error('Task extraction error:', error);
      return [];
    }
  }

  /**
   * Extract due date from email context
   */
  extractDueDate(text, position) {
    // Look for date patterns around the action
    const contextLength = 100;
    const context = text.substring(
      Math.max(0, position - contextLength),
      Math.min(text.length, position + contextLength)
    );

    const datePatterns = [
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
      /(?:today|tomorrow)/i,
      /(?:this|next)\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(?:eod|end of day|end of week)/i,
      /(\d{1,2})\s+(?:hours?|days?|weeks?) from now/i
    ];

    for (const pattern of datePatterns) {
      const match = context.match(pattern);
      if (match) {
        return this.parseDateExpression(match[1]);
      }
    }

    return null;
  }

  /**
   * Parse natural language date expressions
   */
  parseDateExpression(dateStr) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lower = dateStr.toLowerCase();

    if (lower.includes('today')) return today;
    if (lower.includes('tomorrow')) return tomorrow;

    // EOD = end of today
    if (lower.includes('eod') || lower.includes('end of day')) return today;

    // This week = Friday
    if (lower.includes('this week')) {
      const friday = new Date(today);
      friday.setDate(friday.getDate() + (5 - friday.getDay()));
      return friday;
    }

    // Next week = Monday
    if (lower.includes('next week')) {
      const nextMonday = new Date(today);
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()));
      return nextMonday;
    }

    // Try to parse as date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  }

  /**
   * Calculate task priority from context
   */
  calculateTaskPriority(context, subject) {
    const highPriority = ['urgent', 'asap', 'critical', 'important', 'must', 'immediately'];
    const mediumPriority = ['should', 'could', 'review', 'check'];

    const allText = (context + subject).toLowerCase();

    if (highPriority.some(word => allText.includes(word))) return 'high';
    if (mediumPriority.some(word => allText.includes(word))) return 'medium';

    return 'low';
  }

  /**
   * PHASE 3: Get user learning profile
   */
  async getUserLearningProfile(userId) {
    try {
      const conn = await pool.getConnection();
      const [profile] = await conn.query(
        'SELECT * FROM ai_learning_data WHERE user_id = ?',
        [userId]
      );
      conn.release();

      if (profile.length > 0) {
        return profile[0];
      }

      // Initialize default profile
      return {
        emails_marked_important: 0,
        emails_marked_spam: 0,
        avg_task_completion_rate: 0.5,
        priority_distribution: { high: 0.2, medium: 0.6, low: 0.2 }
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {};
    }
  }

  /**
   * PHASE 4: Update learning profile when user takes action
   */
  async updateLearningProfile(userId, action, data) {
    try {
      const conn = await pool.getConnection();

      if (action === 'email_marked_important') {
        await conn.query(
          'UPDATE ai_learning_data SET emails_marked_important = emails_marked_important + 1 WHERE user_id = ?',
          [userId]
        );
      } else if (action === 'task_completed') {
        // Update completion stats
        const [results] = await conn.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN status = "completed" THEN 1 END) as completed FROM tasks WHERE user_id = ?',
          [userId]
        );

        if (results.length > 0) {
          const completionRate = results[0].total > 0 ? results[0].completed / results[0].total : 0;
          await conn.query(
            'UPDATE ai_learning_data SET avg_task_completion_rate = ? WHERE user_id = ?',
            [completionRate, userId]
          );
        }
      }

      conn.release();
    } catch (error) {
      console.error('Error updating learning profile:', error);
    }
  }

  /**
   * Generate daily productivity summary
   */
  async generateProductivitySummary(userId) {
    try {
      const conn = await pool.getConnection();

      // Get today's stats
      const [todayStats] = await conn.query(`
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_today,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_today,
          COUNT(DISTINCT source_email_id) as emails_with_tasks
        FROM tasks 
        WHERE user_id = ? AND DATE(created_at) = CURDATE()
      `, [userId]);

      // Get important emails received today
      const [emailsToday] = await conn.query(`
        SELECT COUNT(*) as important_emails_today
        FROM emails 
        WHERE user_id = ? AND is_important = TRUE AND DATE(received_at) = CURDATE()
      `, [userId]);

      conn.release();

      return {
        completed_today: todayStats[0]?.completed_today || 0,
        pending_today: todayStats[0]?.pending_today || 0,
        important_emails_today: emailsToday[0]?.important_emails_today || 0,
        summary_text: this.generateSummaryText(todayStats[0], emailsToday[0])
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  generateSummaryText(taskStats, emailStats) {
    const completed = taskStats?.completed_today || 0;
    const pending = taskStats?.pending_today || 0;
    const emails = emailStats?.important_emails_today || 0;

    let summary = `You completed ${completed} task${completed !== 1 ? 's' : ''} today`;
    if (pending > 0) {
      summary += ` with ${pending} task${pending !== 1 ? 's' : ''} still pending`;
    }
    if (emails > 0) {
      summary += `. You received ${emails} important email${emails !== 1 ? 's' : ''}.`;
    }

    return summary;
  }
}

module.exports = new AIEngineService();
