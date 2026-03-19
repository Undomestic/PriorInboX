const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const conn = await pool.getConnection();
    
    // Check if user already exists
    const [existingUser] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUser.length > 0) {
      conn.release();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await conn.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    conn.release();

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('🔍 Login attempt for:', req.body.email);
    const { email, password, timezone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('📌 Getting database connection...');
    const conn = await pool.getConnection();
    console.log('✅ Connection acquired');
    
    console.log('📌 Querying user by email...');
    const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('✅ Query result:', users.length, 'users found');
    
    if (users.length === 0) {
      conn.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    console.log('📌 Comparing password...');

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('✅ Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      conn.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Save timezone if provided
    if (timezone) {
      console.log(`⏰ Saving timezone for user: ${timezone}`);
      try {
        await conn.query('UPDATE users SET timezone = ? WHERE id = ?', [timezone, user.id]);
        console.log('✅ Timezone saved');
      } catch (tzError) {
        console.warn('⚠️ Could not save timezone:', tzError.message);
      }
    }

    console.log('📌 Generating JWT token...');
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ Token generated');

    conn.release();

    res.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        timezone: timezone || user.timezone || 'UTC'
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId]);
    
    conn.release();

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.userId;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const conn = await pool.getConnection();
    
    await conn.query('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
    
    conn.release();

    res.json({ 
      message: 'Profile updated successfully',
      username 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const conn = await pool.getConnection();
    
    const [users] = await conn.query('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

    if (!isPasswordValid) {
      conn.release();
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    
    conn.release();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;

    const conn = await pool.getConnection();
    
    // Delete related data first
    await conn.query('DELETE FROM tasks WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM calendar_events WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM emails WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM email_accounts WHERE user_id = ?', [userId]);
    
    // Delete user
    await conn.query('DELETE FROM users WHERE id = ?', [userId]);
    
    conn.release();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user timezone
exports.updateTimezone = async (req, res) => {
  try {
    const { timezone } = req.body;
    const userId = req.user.id;

    if (!timezone) {
      return res.status(400).json({ message: 'Timezone is required' });
    }

    const conn = await pool.getConnection();
    
    await conn.query(
      'UPDATE users SET timezone = ? WHERE id = ?',
      [timezone, userId]
    );

    conn.release();

    res.json({ message: 'Timezone updated successfully', timezone });
  } catch (error) {
    console.error('Update timezone error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user timezone
exports.getTimezone = async (req, res) => {
  try {
    const userId = req.user.id;

    const conn = await pool.getConnection();
    
    const [users] = await conn.query(
      'SELECT timezone FROM users WHERE id = ?',
      [userId]
    );

    conn.release();

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const timezone = users[0].timezone || 'UTC';
    res.json({ timezone });
  } catch (error) {
    console.error('Get timezone error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password - Send Reset Code
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const conn = await pool.getConnection();
    
    // Check if user exists
    const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      conn.release();
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({ message: 'If email exists, a reset code has been sent' });
    }

    const user = users[0];
    
    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate reset token (JWT-like)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 30 minutes from now
    const resetExpiry = new Date(Date.now() + 30 * 60 * 1000);

    // Update user with reset code and token
    await conn.query(
      'UPDATE users SET reset_code = ?, reset_token = ?, reset_expiry = ? WHERE id = ?',
      [resetCode, resetToken, resetExpiry, user.id]
    );

    conn.release();

    // TODO: Send email with reset code
    // For now, log it to console (REMOVE IN PRODUCTION)
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📧 PASSWORD RESET CODE FOR ${email}`);
    console.log(`Reset Code: ${resetCode}`);
    console.log(`Valid until: ${resetExpiry}`);
    console.log(`${'='.repeat(50)}\n`);

    res.json({ message: 'Reset code sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify Reset Code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const conn = await pool.getConnection();
    
    // Check user and reset code
    const [users] = await conn.query(
      'SELECT * FROM users WHERE email = ? AND reset_code = ?',
      [email, code]
    );

    if (users.length === 0) {
      conn.release();
      return res.status(401).json({ message: 'Invalid reset code' });
    }

    const user = users[0];

    // Check if code has expired
    if (new Date() > new Date(user.reset_expiry)) {
      conn.release();
      return res.status(401).json({ message: 'Reset code has expired. Please request a new one' });
    }

    conn.release();

    // Generate a temporary reset token for the password reset endpoint
    const jwt = require('jsonwebtoken');
    const tempResetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    res.json({ 
      message: 'Code verified successfully',
      resetToken: tempResetToken
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const jwt = require('jsonwebtoken');
    
    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key');
      if (decoded.type !== 'password_reset') {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Reset token has expired. Please request a new reset code' });
    }

    const conn = await pool.getConnection();
    
    // Check if user exists and token matches
    const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code/token
    await conn.query(
      'UPDATE users SET password = ?, reset_code = NULL, reset_token = NULL, reset_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    conn.release();

    res.json({ message: 'Password reset successfully. Please log in with your new password' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
