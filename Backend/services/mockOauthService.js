/**
 * Mock OAuth Service for Development/Testing
 * Use this when real OAuth credentials are not yet configured
 */

class MockOAuthService {
  constructor() {
    this.mockProviders = {
      gmail: {
        name: 'Gmail',
        color: '#EA4335'
      },
      outlook: {
        name: 'Outlook',
        color: '#0078D4'
      },
      yahoo: {
        name: 'Yahoo',
        color: '#6B4C9A'
      }
    };
  }

  /**
   * Generate mock OAuth authorization URL
   * This simulates the OAuth flow without real OAuth provider
   */
  getMockAuthorizationUrl(provider, state) {
    // In development, return a mock authorization URL that goes to our mock callback
    return `http://localhost:5000/api/email-accounts/oauth/mock-authorize?provider=${provider}&state=${state}&redirect_uri=http://localhost:5000/api/email-accounts/oauth/callback/${provider}`;
  }

  /**
   * Mock token exchange
   * Returns fake but properly formatted tokens
   */
  async getMockToken(provider) {
    return {
      accessToken: `mock_access_token_${provider}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${provider}_${Date.now()}`,
      expiresIn: 3600,
      tokenType: 'Bearer'
    };
  }

  /**
   * Mock email retrieval
   */
  async getMockUserEmail(provider) {
    const mockEmails = {
      gmail: 'testuser@gmail.com',
      outlook: 'testuser@outlook.com',
      yahoo: 'testuser@yahoo.com'
    };
    return mockEmails[provider] || 'test@example.com';
  }
}

module.exports = new MockOAuthService();
