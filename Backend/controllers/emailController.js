const pool = require('../config/database');
const { categorizeEmail, getImportanceScore } = require('../services/emailAIService');

// Get all emails for user with optional filtering
exports.getEmails = async (req, res) => {
  try {
    const { filter = 'all', category, account } = req.query; // 'important', 'unread', 'all', and optional category
    let query = 'SELECT * FROM emails WHERE user_id = ?';
    const params = [req.user.id];

    // Filter by email account if specified
    if (account) {
      query += ' AND email_account_id = ?';
      params.push(account);
    }

    if (filter === 'important') {
      query += ' AND is_important = true';
    } else if (filter === 'unread') {
      query += ' AND is_read = false';
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const conn = await pool.getConnection();
    const [emails] = await conn.query(query, params);
    conn.release();
    
    res.json(emails);
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark email as important
exports.markAsImportant = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { is_important } = req.body;

    const conn = await pool.getConnection();
    
    // Verify email belongs to user
    const [emails] = await conn.query(
      'SELECT id FROM emails WHERE id = ? AND user_id = ?',
      [emailId, req.user.id]
    );

    if (emails.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Email not found' });
    }

    await conn.query('UPDATE emails SET is_important = ? WHERE id = ?', [is_important, emailId]);

    conn.release();

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Mark important error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark email as read
exports.markAsRead = async (req, res) => {
  try {
    const { emailId } = req.params;

    const conn = await pool.getConnection();
    
    // Verify email belongs to user
    const [emails] = await conn.query(
      'SELECT id FROM emails WHERE id = ? AND user_id = ?',
      [emailId, req.user.id]
    );

    if (emails.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Email not found' });
    }

    await conn.query('UPDATE emails SET is_read = true WHERE id = ?', [emailId]);

    conn.release();

    res.json({ message: 'Email marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create task from email (AI-generated)
exports.createTaskFromEmail = async (req, res) => {
  try {
    const { emailId, title, due_date, priority } = req.body;

    if (!emailId || !title) {
      return res.status(400).json({ message: 'Email ID and title are required' });
    }

    const conn = await pool.getConnection();
    
    // Verify email exists
    const [emails] = await conn.query(
      'SELECT id, subject, body FROM emails WHERE id = ? AND user_id = ?',
      [emailId, req.userId]
    );

    if (emails.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Email not found' });
    }

    // Create task
    const [result] = await conn.query(
      'INSERT INTO tasks (user_id, title, description, status, priority, due_date, source_email_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        title,
        emails[0].body || emails[0].subject,
        'pending',
        priority || 'medium',
        due_date || null,
        emailId
      ]
    );

    conn.release();

    res.status(201).json({ 
      message: 'Task created from email',
      taskId: result.insertId 
    });
  } catch (error) {
    console.error('Create task from email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get emails by category
exports.getEmailsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const conn = await pool.getConnection();
    const [emails] = await conn.query(
      'SELECT * FROM emails WHERE user_id = ? AND category = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id, category]
    );
    conn.release();
    
    res.json(emails);
  } catch (error) {
    console.error('Get emails by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get important emails only (dashboard view)
exports.getImportantEmails = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [emails] = await conn.query(
      'SELECT * FROM emails WHERE user_id = ? AND is_important = true ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    conn.release();
    
    res.json(emails);
  } catch (error) {
    console.error('Get important emails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Archive email
exports.archiveEmail = async (req, res) => {
  try {
    const { emailId } = req.params;

    const conn = await pool.getConnection();
    
    const [emails] = await conn.query(
      'SELECT id FROM emails WHERE id = ? AND user_id = ?',
      [emailId, req.user.id]
    );

    if (emails.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Email not found' });
    }

    await conn.query('UPDATE emails SET is_archived = true WHERE id = ?', [emailId]);
    conn.release();

    res.json({ message: 'Email archived successfully' });
  } catch (error) {
    console.error('Archive email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
