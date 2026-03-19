const axios = require('axios');
const pool = require('../config/database');
const encryptionService = require('./encryptionService');
const oauthService = require('./oauthService');

/**
 * Gmail Service - Fetch and sync emails from Gmail
 */
class GmailService {
  /**
   * Fetch emails from Gmail API
   * @param {string} accessToken - Gmail access token
   * @param {number} maxResults - Max emails to fetch (default 10)
   * @returns {array} Array of emails
   */
  async fetchEmails(accessToken, maxResults = 10) {
    try {
      console.log(`🔍 Fetching ${maxResults} emails from Gmail...`);
      
      // Get list of message IDs
      const listResponse = await axios.get(
        'https://www.googleapis.com/gmail/v1/users/me/messages',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { maxResults: maxResults, q: 'is:unread OR is:starred' }
        }
      );

      const messages = listResponse.data.messages || [];
      console.log(`✅ Found ${messages.length} messages`);

      const emails = [];
      
      // Fetch full details for each message
      for (const message of messages) {
        try {
          const messageResponse = await axios.get(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              params: { format: 'full' }
            }
          );

          const email = this.parseGmailMessage(messageResponse.data);
          emails.push(email);
        } catch (err) {
          console.error(`Failed to fetch message ${message.id}:`, err.message);
        }
      }

      return emails;
    } catch (error) {
      console.error('❌ Error fetching emails from Gmail:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Parse Gmail message and extract relevant data
   * @param {object} gmailMessage - Gmail message object
   * @returns {object} Parsed email
   */
  parseGmailMessage(gmailMessage) {
    const headers = gmailMessage.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name === name);
      return header ? header.value : '';
    };

    // Get email body
    let body = '';
    if (gmailMessage.payload.parts) {
      // Multipart message
      const textPart = gmailMessage.payload.parts.find(p => p.mimeType === 'text/plain');
      if (textPart && textPart.body && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf8');
      }
    } else if (gmailMessage.payload.body && gmailMessage.payload.body.data) {
      // Single part message
      body = Buffer.from(gmailMessage.payload.body.data, 'base64').toString('utf8');
    }

    return {
      message_id: gmailMessage.id,
      from_address: getHeader('From'),
      subject: getHeader('Subject'),
      body: body.substring(0, 1000), // Limit body to 1000 chars
      is_read: !gmailMessage.labelIds?.includes('UNREAD'),
      is_important: gmailMessage.labelIds?.includes('IMPORTANT') || gmailMessage.labelIds?.includes('STARRED'),
      received_at: new Date(parseInt(gmailMessage.internalDate))
    };
  }

  /**
   * Sync emails from Gmail to database
   * @param {number} userId - User ID
   * @param {number} accountId - Email account ID
   * @param {string} encryptedAccessToken - Encrypted access token
   * @param {string} encryptedRefreshToken - Encrypted refresh token
   * @param {string} provider - OAuth provider (gmail)
   * @returns {object} Sync result
   */
  async syncEmailsToDatabase(userId, accountId, encryptedAccessToken, encryptedRefreshToken, provider = 'gmail') {
    try {
      // Decrypt tokens
      if (!encryptedAccessToken) {
        throw new Error('No access token found. Please reconnect your email account.');
      }
      
      let accessToken = encryptionService.decrypt(encryptedAccessToken);
      const refreshToken = encryptedRefreshToken ? encryptionService.decrypt(encryptedRefreshToken) : null;

      // Try to fetch emails with current token
      let emails;
      try {
        console.log('🔑 Using current access token...');
        emails = await this.fetchEmails(accessToken, 20);
      } catch (error) {
        if (error.response && error.response.status === 401 && refreshToken) {
          // Token expired, refresh it
          console.log('🔄 Access token expired, refreshing...');
          try {
            const tokenData = await oauthService.refreshAccessToken(provider, refreshToken);
            accessToken = tokenData.accessToken; // Note: camelCase from oauthService
            
            // Update token in database (and refresh token if new one provided)
            if (tokenData.refreshToken) {
              await pool.query(
                'UPDATE email_accounts SET access_token = ?, refresh_token = ? WHERE id = ?',
                [encryptionService.encrypt(accessToken), encryptionService.encrypt(tokenData.refreshToken), accountId]
              );
            } else {
              await pool.query(
                'UPDATE email_accounts SET access_token = ? WHERE id = ?',
                [encryptionService.encrypt(accessToken), accountId]
              );
            }
            
            console.log('✅ Token refreshed, retrying fetch...');
            emails = await this.fetchEmails(accessToken, 20);
          } catch (refreshError) {
            console.error('❌ Failed to refresh token:', refreshError.message);
            throw new Error('Failed to refresh access token. Please re-connect your Gmail account.');
          }
        } else {
          // Other error, re-throw
          throw error;
        }
      }

      if (emails.length === 0) {
        console.log('ℹ️ No new emails to sync');
        return { success: true, count: 0, message: 'No new emails' };
      }

      // Save emails to database
      const conn = await pool.getConnection();
      let savedCount = 0;

      for (const email of emails) {
        try {
          // Insert new email (Gmail message ID not stored, just check by subject+from combination)
          // Insert the email
          await conn.query(
            `INSERT INTO emails (user_id, email_account_id, from_address, subject, body, is_read, is_important, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              accountId,
              email.from_address,
              email.subject,
              email.body,
              email.is_read ? 1 : 0,
              email.is_important ? 1 : 0,
              new Date()
            ]
          );
          savedCount++;
        } catch (err) {
          console.error(`Failed to save email from ${email.from_address}:`, err.message);
        }
      }

      conn.release();

      console.log(`✅ Synced ${savedCount} new emails`);
      return { success: true, count: savedCount, message: `Synced ${savedCount} emails` };
    } catch (error) {
      console.error('❌ Error syncing emails:', error.message);
      throw new Error(`Failed to sync emails: ${error.message}`);
    }
  }
}

module.exports = new GmailService();
