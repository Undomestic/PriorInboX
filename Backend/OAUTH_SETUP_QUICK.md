# OAuth Configuration - Quick Setup Guide

## Current Status
✅ Database configured
✅ Encryption key valid  
❌ **OAuth credentials missing** ← This is causing "fail to get authorization"

## 🚀 Quick Setup Option 1: Use Real OAuth (5-10 minutes)

### For Gmail (Google OAuth 2.0)
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable Gmail API
4. Go to Credentials → Create OAuth 2.0 credentials
5. Choose "Web application"
6. Add Authorized redirect URI: `http://localhost:5000/api/email-accounts/oauth/callback/gmail`
7. Copy Client ID and Client Secret
8. Add to .env:
```env
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
```

### For Outlook (Microsoft OAuth 2.0)
1. Go to https://portal.azure.com/
2. Go to Azure AD → App registrations
3. Create new registration
4. Go to Certificates & secrets → Create client secret
5. Go to Redirect URIs → Add: `http://localhost:5000/api/email-accounts/oauth/callback/outlook`
6. Copy Application ID and Client Secret
7. Add to .env:
```env
OUTLOOK_CLIENT_ID=your-app-id
OUTLOOK_CLIENT_SECRET=your-client-secret
```

### For Yahoo
1. Go to https://developer.yahoo.com/
2. Create application
3. Copy Client ID and Secret
4. Add to .env:
```env
YAHOO_CLIENT_ID=your-yahoo-id
YAHOO_CLIENT_SECRET=your-yahoo-secret
```

---

## 🔧 Quick Setup Option 2: Use Test/Demo Mode (Immediate)

If you want to test the feature WITHOUT setting up real OAuth right now:

### Step 1: Create a test configuration
Create `Backend/.env.test` with test OAuth values (we'll use these for development):

```env
# Test OAuth credentials (these won't work for real auth, but will test the flow)
GMAIL_CLIENT_ID=123456789.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=test-secret-key-12345
OUTLOOK_CLIENT_ID=test-app-id-12345
OUTLOOK_CLIENT_SECRET=test-app-secret
YAHOO_CLIENT_ID=test-yahoo-id
YAHOO_CLIENT_SECRET=test-yahoo-secret
```

### Step 2: Modify server.js to load test config in development
Update the very top of `server.js`:
```javascript
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});
```

### Step 3: Start with test mode
```bash
NODE_ENV=test npm start
```

This will at least let you test the UI flow and see if the authorization URL generates properly.

---

## ✅ Recommended Path

1. **Option A (Best)**: Use real OAuth credentials from Google/Microsoft
   - Takes 5-10 minutes
   - Works end-to-end
   - Can actually authenticate

2. **Option B (Quick)**: Use test credentials
   - Immediate
   - Tests the flow
   - Can't authenticate with real providers
   - Good for UI/frontend testing

---

## 📋 After Configuring OAuth

1. Update `.env` file with real credentials
2. Restart backend: `npm start`
3. Check configuration: `node check-config.js`
4. Visit: `http://localhost:8000/emails.html`
5. Click "+ Add Email Account"
6. Select provider
7. Should redirect to provider's login page

---

## 🐛 If Still Getting "fail to get authorization"

After configuring credentials, if you still get the error:

1. Check backend console for specific error message
2. Verify redirect URIs match exactly in both .env and provider console
3. Make sure client ID and secret are correct
4. Check that you're copying from the right credentials (not API key)

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "YOUR_GMAIL_CLIENT_ID_HERE" in error | Replace with actual credentials |
| Redirect URI mismatch | Ensure exact match: `http://localhost:5000/api/email-accounts/oauth/callback/gmail` |
| Invalid credentials | Double-check copied values |
| Network error | Check internet connection |
| CORS error | Verify CORS is enabled in .env |

---

## Run Configuration Check

```bash
cd Backend
node check-config.js
```

This will show you exactly what's configured and what's missing.
