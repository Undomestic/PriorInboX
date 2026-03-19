const axios = require('axios');
const encryptionService = require('./encryptionService');

/**
 * OAuth Integration Service
 * Handles OAuth 2.0 flows for Gmail, Outlook, and other providers
 */
class OAuthService {
  constructor() {
    this.providers = {
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/email-accounts/oauth/callback/gmail',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        revokeUrl: 'https://oauth2.googleapis.com/revoke',
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://mail.google.com/'
        ]
      },
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        redirectUri: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:5000/api/email-accounts/oauth/callback/outlook',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        revokeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
        scopes: [
          'Mail.Read',
          'Mail.ReadWrite',
          'offline_access'
        ]
      },
      yahoo: {
        clientId: process.env.YAHOO_CLIENT_ID,
        clientSecret: process.env.YAHOO_CLIENT_SECRET,
        redirectUri: process.env.YAHOO_REDIRECT_URI || 'http://localhost:5000/api/email-accounts/oauth/callback/yahoo',
        authUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
        tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token',
        scopes: []
      }
    };
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} provider - OAuth provider (gmail, outlook, yahoo)
   * @param {string} state - CSRF protection state token
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(provider, state) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    // Check if OAuth credentials are configured
    if (!config.clientId || config.clientId.includes('YOUR_')) {
      console.error(`❌ OAuth credentials not configured for ${provider}`);
      console.error(`   Please set ${provider.toUpperCase()}_CLIENT_ID in .env`);
      throw new Error(`OAuth credentials not configured for ${provider}. Check .env file.`);
    }

    if (!config.clientSecret || config.clientSecret.includes('YOUR_')) {
      console.error(`❌ OAuth secret not configured for ${provider}`);
      console.error(`   Please set ${provider.toUpperCase()}_CLIENT_SECRET in .env`);
      throw new Error(`OAuth secret not configured for ${provider}. Check .env file.`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    console.log(`✅ Generated authorization URL for ${provider}`);
    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} provider - OAuth provider
   * @param {string} authorizationCode - Authorization code from OAuth redirect
   * @returns {object} Token response { access_token, refresh_token, expires_in }
   */
  async exchangeCodeForToken(provider, authorizationCode) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    try {
      const response = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: authorizationCode,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };
    } catch (error) {
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} provider - OAuth provider
   * @param {string} refreshToken - Refresh token
   * @returns {object} New token response
   */
  async refreshAccessToken(provider, refreshToken) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    try {
      const response = await axios.post(config.tokenUrl, {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken, // Some providers don't return new refresh token
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Get user email address from provider
   * @param {string} provider - OAuth provider
   * @param {string} accessToken - Access token
   * @returns {string} User's email address
   */
  async getUserEmail(provider, accessToken) {
    try {
      console.log(`🔍 Getting user email for provider: ${provider}`);
      
      if (provider === 'gmail') {
        console.log('  Trying Google userinfo endpoint...');
        try {
          const response = await axios.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          console.log('✅ Got email from userinfo:', response.data.email);
          return response.data.email;
        } catch (err) {
          // Fallback to Gmail API
          console.log('  Fallback to Gmail API profile endpoint...');
          const response = await axios.get(
            'https://www.googleapis.com/gmail/v1/users/me/profile',
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          console.log('✅ Got email from Gmail API:', response.data.emailAddress);
          return response.data.emailAddress;
        }
      } else if (provider === 'outlook') {
        console.log('  Using Microsoft Graph endpoint...');
        const response = await axios.get(
          'https://graph.microsoft.com/v1.0/me',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const email = response.data.userPrincipalName || response.data.mail;
        console.log('✅ Got email:', email);
        return email;
      } else if (provider === 'yahoo') {
        console.log('  Using Yahoo userinfo endpoint...');
        const response = await axios.get(
          'https://api.login.yahoo.com/openid/v1/userinfo',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log('✅ Got email:', response.data.email);
        return response.data.email;
      }
    } catch (error) {
      console.error('❌ Error getting user email:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.message);
      console.error('   Response:', error.response?.data);
      throw new Error(`Failed to get user email: ${error.message}`);
    }
  }

  /**
   * Revoke OAuth token (disconnect account)
   * @param {string} provider - OAuth provider
   * @param {string} accessToken - Access token to revoke
   */
  async revokeToken(provider, accessToken) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    try {
      if (provider === 'gmail') {
        await axios.post(config.revokeUrl, { token: accessToken });
      } else if (provider === 'outlook') {
        // Outlook doesn't have a direct revoke endpoint, token will expire naturally
        // In production, maintain a token blacklist in the database
      }
    } catch (error) {
      console.warn(`Warning: Failed to revoke token for ${provider}: ${error.message}`);
      // Don't fail if revocation fails - token will expire naturally
    }
  }
}

module.exports = new OAuthService();
