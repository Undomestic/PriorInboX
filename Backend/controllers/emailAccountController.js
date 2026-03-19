const pool = require('../config/database');
const encryptionService = require('../services/encryptionService');
const oauthService = require('../services/oauthService');
const gmailService = require('../services/gmailService');

// Get all connected email accounts for a user
exports.getEmailAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [accounts] = await pool.query(
      'SELECT id, email, provider, is_connected, last_synced, created_at FROM email_accounts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      accounts: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch accounts' });
  }
};

// Get OAuth authorization URL
exports.getAuthorizationUrl = async (req, res) => {
  try {
    const { provider } = req.query;
    const userId = req.user.id;

    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider is required' });
    }

    // Generate CSRF protection state token
    const state = encryptionService.generateToken(32);
    
    // Store state in database with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const [result] = await pool.query(
      'INSERT INTO oauth_states (user_id, state_token, provider, expires_at) VALUES (?, ?, ?, ?)',
      [userId, state, provider, expiresAt]
    );

    const authUrl = oauthService.getAuthorizationUrl(provider, state);

    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// OAuth callback handler
exports.oauthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const { provider } = req.params;

    console.log('🔍 OAuth Callback received:');
    console.log('  Provider:', provider);
    console.log('  Code:', code ? 'Present' : 'Missing');
    console.log('  State:', state ? state.substring(0, 10) + '...' : 'Missing');

    if (!code || !state || !provider) {
      return res.status(400).redirect(`http://localhost:8000/emails.html?error=${encodeURIComponent('Missing required OAuth parameters')}`);
    }

    // Verify state token from database (CSRF protection)
    const [oauthStates] = await pool.query(
      'SELECT user_id, provider FROM oauth_states WHERE state_token = ? AND provider = ?',
      [state, provider]
    );

    if (oauthStates.length === 0) {
      console.error('❌ State token not found in database');
      return res.status(400).redirect(`http://localhost:8000/emails.html?error=${encodeURIComponent('Invalid state token')}`);
    }

    const oauthState = oauthStates[0];
    const userId = oauthState.user_id;

    // Delete the used state token
    await pool.query('DELETE FROM oauth_states WHERE state_token = ?', [state]);

    console.log('✅ State token verified for user:', userId);

    // Exchange code for access token
    const tokenData = await oauthService.exchangeCodeForToken(provider, code);

    // Get user's email from provider
    const email = await oauthService.getUserEmail(provider, tokenData.accessToken);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptionService.encrypt(tokenData.accessToken);
    const encryptedRefreshToken = tokenData.refreshToken 
      ? encryptionService.encrypt(tokenData.refreshToken)
      : null;

    // Check if account already exists
    const [existing] = await pool.query(
      'SELECT id FROM email_accounts WHERE user_id = ? AND email = ? AND provider = ?',
      [userId, email, provider]
    );

    let accountId;
    if (existing.length > 0) {
      // Update existing account
      accountId = existing[0].id;
      await pool.query(
        `UPDATE email_accounts 
         SET access_token = ?, refresh_token = ?, is_connected = TRUE, last_synced = NOW()
         WHERE id = ?`,
        [encryptedAccessToken, encryptedRefreshToken, accountId]
      );
    } else {
      // Create new account
      const [result] = await pool.query(
        `INSERT INTO email_accounts (user_id, email, provider, access_token, refresh_token, is_connected, last_synced)
         VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
        [userId, email, provider, encryptedAccessToken, encryptedRefreshToken]
      );
      accountId = result.insertId;
    }

    console.log('✅ Email account connected:', email);

    // Redirect to frontend with success
    res.redirect(`http://localhost:8000/emails.html?account_connected=${email}&provider=${provider}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`http://localhost:8000/emails.html?error=${encodeURIComponent(error.message)}`);
  }
};

// Connect email account
exports.connectEmailAccount = async (req, res) => {
  try {
    const { email, provider, access_token, refresh_token } = req.body;

    if (!email || !provider) {
      return res.status(400).json({ message: 'Email and provider are required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM email_accounts WHERE user_id = ? AND email = ?',
      [req.user.id, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email account already connected' });
    }

    // Encrypt tokens
    const encryptedAccessToken = encryptionService.encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encryptionService.encrypt(refresh_token) : null;

    // Add new email account
    const [result] = await pool.query(
      'INSERT INTO email_accounts (user_id, email, provider, access_token, refresh_token, is_connected) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, email, provider, encryptedAccessToken, encryptedRefreshToken, true]
    );

    res.status(201).json({ 
      message: 'Email account connected successfully',
      accountId: result.insertId 
    });
  } catch (error) {
    console.error('Connect email account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Disconnect email account
exports.disconnectEmailAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;

    // Verify ownership
    const [accounts] = await pool.query(
      'SELECT access_token, provider FROM email_accounts WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const account = accounts[0];

    // Revoke OAuth token
    if (account.access_token) {
      try {
        const decryptedToken = encryptionService.decrypt(account.access_token);
        await oauthService.revokeToken(account.provider, decryptedToken);
      } catch (revokeError) {
        console.warn('Token revocation warning:', revokeError.message);
      }
    }

    // Delete account from database
    await pool.query('DELETE FROM email_accounts WHERE id = ?', [accountId]);

    // Also delete associated emails
    await pool.query('DELETE FROM emails WHERE email_account_id = ?', [accountId]);

    res.json({ success: true, message: 'Email account disconnected successfully' });
  } catch (error) {
    console.error('Disconnect email account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Refresh access token (called when token is near expiration)
exports.refreshToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;

    // Verify ownership
    const [accounts] = await pool.query(
      'SELECT refresh_token, provider FROM email_accounts WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const account = accounts[0];

    if (!account.refresh_token) {
      return res.status(400).json({ success: false, message: 'No refresh token available' });
    }

    // Decrypt refresh token
    const decryptedRefreshToken = encryptionService.decrypt(account.refresh_token);

    // Get new access token
    const newTokenData = await oauthService.refreshAccessToken(account.provider, decryptedRefreshToken);

    // Encrypt and store new tokens
    const encryptedAccessToken = encryptionService.encrypt(newTokenData.accessToken);
    const encryptedRefreshToken = newTokenData.refreshToken
      ? encryptionService.encrypt(newTokenData.refreshToken)
      : account.refresh_token;

    await pool.query(
      'UPDATE email_accounts SET access_token = ?, refresh_token = ? WHERE id = ?',
      [encryptedAccessToken, encryptedRefreshToken, accountId]
    );

    res.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh token' });
  }
};

// Sync emails from account
exports.syncEmails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;

    // Verify account belongs to user
    const [accounts] = await pool.query(
      'SELECT * FROM email_accounts WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ success: false, message: 'Email account not found' });
    }

    const account = accounts[0];

    // Only Gmail is supported for now
    if (account.provider !== 'gmail') {
      return res.status(400).json({ success: false, message: 'Only Gmail sync is supported' });
    }

    // Sync emails from Gmail
    console.log(`🔄 Starting email sync for account ${accountId} (${account.email})...`);
    const syncResult = await gmailService.syncEmailsToDatabase(
      userId,
      accountId,
      account.access_token,
      account.refresh_token,
      account.provider
    );

    // Update last_synced timestamp
    await pool.query(
      'UPDATE email_accounts SET last_synced = NOW() WHERE id = ?',
      [accountId]
    );

    res.json({ 
      success: true,
      message: syncResult.message,
      count: syncResult.count
    });
  } catch (error) {
    console.error('❌ Sync emails error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get email statistics
exports.getEmailStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_emails,
        SUM(CASE WHEN is_important = true THEN 1 ELSE 0 END) as important_count,
        SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count
      FROM emails WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      summary: stats[0]
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
