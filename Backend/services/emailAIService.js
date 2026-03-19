const pool = require('../config/database');

// Email categorization system
const emailCategories = {
  WORK: 'work',
  PERSONAL: 'personal',
  SOCIAL: 'social',
  PROMOTIONAL: 'promotional',
  NOTIFICATIONS: 'notifications'
};

// Rule-based email importance detection
const analyzeEmailImportance = (subject, body, fromAddress = '') => {
  const score = getImportanceScore(subject, body, fromAddress);
  // Mark as important if score is above threshold (30 is the importance threshold)
  return score >= 30;
};

// Categorize emails using rule-based system
const categorizeEmail = (subject, body, fromAddress) => {
  const text = `${subject} ${body}`.toLowerCase();
  const fromLower = fromAddress.toLowerCase();

  // Work-related keywords
  if (
    text.includes('work') || text.includes('project') || text.includes('meeting') ||
    text.includes('team') || text.includes('deadline') || text.includes('task') ||
    text.includes('report') || text.includes('presentation')
  ) {
    return emailCategories.WORK;
  }

  // Promotional/Marketing
  if (
    text.includes('sale') || text.includes('discount') || text.includes('offer') ||
    text.includes('promotion') || text.includes('subscribe') || text.includes('newsletter') ||
    text.includes('limited time') || fromLower.includes('marketing')
  ) {
    return emailCategories.PROMOTIONAL;
  }

  // Notifications (system/app)
  if (
    text.includes('notification') || text.includes('alert') || text.includes('update') ||
    text.includes('confirm') || text.includes('verify') || fromLower.includes('noreply') ||
    fromLower.includes('notification') || fromLower.includes('alerts')
  ) {
    return emailCategories.NOTIFICATIONS;
  }

  // Social media/friends
  if (
    fromLower.includes('facebook') || fromLower.includes('instagram') ||
    fromLower.includes('twitter') || fromLower.includes('linkedin') ||
    fromLower.includes('friend') || text.includes('commented')
  ) {
    return emailCategories.SOCIAL;
  }

  // Default to personal
  return emailCategories.PERSONAL;
};

// Extract email importance score (0-100)
const getImportanceScore = (subject, body, fromAddress) => {
  let score = 0;

  // Keywords weights for scoring
  const urgentKeywords = [
    { word: 'urgent', weight: 30 },
    { word: 'asap', weight: 30 },
    { word: 'immediately', weight: 25 },
    { word: 'critical', weight: 35 },
    { word: 'emergency', weight: 40 },
    { word: 'important', weight: 20 }
  ];

  const deadlineKeywords = [
    { word: 'deadline', weight: 25 },
    { word: 'due', weight: 20 },
    { word: 'expires', weight: 25 },
    { word: 'submission', weight: 20 },
    { word: 'due date', weight: 22 }
  ];

  const opportunityKeywords = [
    { word: 'interview', weight: 35 },
    { word: 'offer', weight: 40 },
    { word: 'approved', weight: 30 },
    { word: 'promotion', weight: 35 },
    { word: 'selected', weight: 30 },
    { word: 'congratulations', weight: 25 }
  ];

  const actionKeywords = [
    { word: 'action required', weight: 30 },
    { word: 'review', weight: 15 },
    { word: 'confirm', weight: 15 },
    { word: 'approval', weight: 20 },
    { word: 'validate', weight: 15 }
  ];

  const meetingKeywords = [
    { word: 'meeting scheduled', weight: 20 },
    { word: 'call scheduled', weight: 15 },
    { word: 'appointment', weight: 15 },
    { word: 'booked', weight: 12 }
  ];

  const financialKeywords = [
    { word: 'payment', weight: 20 },
    { word: 'invoice', weight: 18 },
    { word: 'receipt', weight: 15 },
    { word: 'charge', weight: 18 },
    { word: 'billing', weight: 15 },
    { word: 'refund', weight: 20 }
  ];

  const securityKeywords = [
    { word: 'verify', weight: 25 },
    { word: 'confirm identity', weight: 30 },
    { word: 'suspicious activity', weight: 40 },
    { word: 'security alert', weight: 35 },
    { word: 'password reset', weight: 25 }
  ];

  const text = `${subject} ${body}`.toLowerCase();
  const fromLower = fromAddress.toLowerCase();

  // Check urgent keywords
  urgentKeywords.forEach(item => {
    if (text.includes(item.word)) score += item.weight;
  });

  // Check deadline keywords
  deadlineKeywords.forEach(item => {
    if (text.includes(item.word)) score += item.weight;
  });

  // Check opportunity keywords
  opportunityKeywords.forEach(item => {
    if (text.includes(item.word)) score += item.weight;
  });

  // Check action keywords
  actionKeywords.forEach(item => {
    if (text.includes(item.word)) score += item.weight;
  });

  // Check meeting keywords
  meetingKeywords.forEach(item => {
    if (text.includes(item.word)) score += item.weight;
  });

  // Check financial keywords
  financialKeywords.forEach(item => {
    if (text.includes(item.word)) score += item.weight;
  });

  // Check security keywords
  securityKeywords.forEach(item => {
    if (text.includes(item.word)) score += item.weight;
  });

  // Boost score based on sender
  const importantSenderPatterns = [
    'boss', 'manager', 'ceo', 'director', 'executive',
    'hr@', 'noreply@linkedin', 'jobs@', 'recruiter',
    'support@', 'help@', 'billing@'
  ];

  importantSenderPatterns.forEach(pattern => {
    if (fromLower.includes(pattern)) score += 15;
  });

  // Penalize spam/promotional patterns
  const spamPatterns = ['unsubscribe', 'promotional', 'marketing', 'deal', 'offer expires'];
  spamPatterns.forEach(pattern => {
    if (text.includes(pattern)) score = Math.max(0, score - 10);
  });

  // Check email length (very short emails might be less important)
  if (body && body.length < 50) {
    score = Math.max(0, score - 5);
  }

  // Apply caps lock bonus (ALL CAPS might indicate urgency)
  const capsWords = text.match(/\b[A-Z]{2,}\b/g) || [];
  if (capsWords.length > 3) {
    score += 5;
  }

  // Subject line analysis
  if (subject.includes('!')) score += 5;
  if (subject.includes('????')) score += 3;

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
};

const extractTaskFromEmail = (subject, body, from) => {
  // Simple regex to find potential tasks
  const taskPatterns = [
    /please\s+(?:send|submit|complete|finish|review)\s+(.+?)(?:\.|,|;)/gi,
    /need\s+(.+?)(?:by|before|on)\s+(\d{1,2}\/\d{1,2})/gi,
    /task:\s+(.+?)(?:\.|,|;)/gi
  ];

  let extractedTasks = [];

  taskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(body)) !== null) {
      extractedTasks.push({
        title: match[1].trim(),
        description: `From: ${from}\nSubject: ${subject}`,
        priority: 'medium'
      });
    }
  });

  return extractedTasks.length > 0 ? extractedTasks[0] : null;
};

const extractCalendarEvent = (subject, body) => {
  // Simple extraction of meeting/event dates
  const datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/;
  const timePattern = /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i;

  const dateMatch = datePattern.exec(body || subject);
  const timeMatch = timePattern.exec(body || subject);

  if (dateMatch) {
    return {
      title: subject,
      event_date: dateMatch[1],
      event_time: timeMatch ? timeMatch[1] : null
    };
  }

  return null;
};

// Store email in database
const storeEmail = async (userId, emailAccountId, emailData) => {
  const {
    from_address,
    subject,
    body,
    message_id,
    received_date
  } = emailData;

  try {
    const conn = await pool.getConnection();

    // Check if email already exists
    const [existing] = await conn.query(
      'SELECT id FROM emails WHERE message_id = ? AND user_id = ?',
      [message_id, userId]
    );

    if (existing.length > 0) {
      conn.release();
      return existing[0].id; // Already stored
    }

    // Analyze email importance
    const isImportant = analyzeEmailImportance(subject, body, from_address);

    // Insert email
    const [result] = await conn.query(
      'INSERT INTO emails (user_id, email_account_id, from_address, subject, body, message_id, is_important, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, emailAccountId, from_address, subject, body, message_id, isImportant, received_date]
    );

    const emailId = result.insertId;

    // Extract and create task if found
    const task = extractTaskFromEmail(subject, body, from_address);
    if (task) {
      await conn.query(
        'INSERT INTO tasks (user_id, title, description, status, priority, source_email_id) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, task.title, task.description, 'pending', task.priority, emailId]
      );
    }

    // Extract and create calendar event if found
    const event = extractCalendarEvent(subject, body);
    if (event) {
      await conn.query(
        'INSERT INTO calendar_events (user_id, title, event_date, event_time) VALUES (?, ?, ?, ?)',
        [userId, event.title, event.event_date, event.event_time]
      );
    }

    conn.release();
    return emailId;

  } catch (error) {
    console.error('Store email error:', error);
    throw error;
  }
};

module.exports = {
  analyzeEmailImportance,
  getImportanceScore,
  extractTaskFromEmail,
  extractCalendarEvent,
  storeEmail,
  categorizeEmail
};
