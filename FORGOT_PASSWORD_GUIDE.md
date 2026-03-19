# Forgot Password Feature - Complete Guide

## Overview
The forgot password feature allows users to reset their passwords in 3 steps:
1. **Request Reset Code** - Enter email to receive a 6-digit code
2. **Verify Code** - Enter the code sent to their email
3. **Reset Password** - Create a new password

## Frontend Implementation

### Files Modified:
- `Frontend/form/form-home.html` - Added forgot password forms and functions

### UI Components:

#### 1. Forgot Password Form (Step 1)
- Users click "Forgot password?" link on the login form
- Enter their email address
- System sends a 6-digit reset code

#### 2. Verify Code Form (Step 2)
- Users enter the 6-digit code they received
- Code is validated on the backend
- Valid code generates a temporary reset token

#### 3. Reset Password Form (Step 3)
- Users create a new strong password
- Password strength indicator shows real-time feedback
- Must confirm password match
- New password is securely sent to backend

### JavaScript Functions:

```javascript
// Show forgot password form
showForgotPasswordForm(e)

// Handle forgot password - send reset code
handleForgotPassword()

// Handle verify code
handleVerifyCode()

// Check reset password strength
checkResetPasswordStrength()

// Handle reset password
handleResetPassword()

// Navigation helpers
toggleToSignIn()
```

## Backend Implementation

### Files Modified:
- `Backend/controllers/authController.js` - Added 3 new endpoints
- `Backend/routes/authRoutes.js` - Added routes for password reset
- `Backend/add-password-reset.js` - Migration script

### Database Changes:

Added 3 columns to `users` table:
- `reset_code` (VARCHAR 10) - 6-digit code sent to user
- `reset_token` (VARCHAR 255) - Temporary JWT token for password change
- `reset_expiry` (DATETIME) - When the reset code expires (30 minutes)

### Run Migration:
```bash
cd Backend
node add-password-reset.js
```

### API Endpoints:

#### 1. POST /api/auth/forgot-password
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Reset code sent to email"
}
```

**What happens:**
- Generates 6-digit random code
- Creates temporary reset token
- Sets 30-minute expiry
- Logs code to console (TODO: send via email)

#### 2. POST /api/auth/verify-reset-code
**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Code verified successfully",
  "resetToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Validation:**
- Verifies code matches user's email
- Checks if code has not expired
- Generates JWT token valid for 15 minutes

#### 3. POST /api/auth/reset-password
**Request:**
```json
{
  "email": "user@example.com",
  "resetToken": "eyJhbGciOiJIUzI1NiIs...",
  "newPassword": "NewPassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. Please log in with your new password"
}
```

**What happens:**
- Verifies reset token
- Hashes new password with bcrypt
- Updates user password in database
- Clears all reset-related fields
- User can now login with new password

## Security Features

1. **Code Expiry** - Codes expire after 30 minutes
2. **Token Verification** - Reset token is JWT-signed and expires after 15 minutes
3. **One-Time Use** - Reset codes are cleared after password update
4. **Hashed Passwords** - All passwords hashed with bcrypt (10 rounds)
5. **Email Validation** - Basic email format validation on frontend
6. **Rate Limiting** - Currently not implemented (TODO)

## Testing

### Manual Testing Steps:

1. **Test Flow:**
   ```
   Login Page → Forgot Password Link → Enter Email → 
   Enter Code (see console for code) → Create New Password → 
   Login with New Password
   ```

2. **Check Console for Reset Code:**
   - Open Backend terminal
   - Code displayed in format:
     ```
     ==================================================
     📧 PASSWORD RESET CODE FOR user@example.com
     Reset Code: 123456
     Valid until: 2026-02-05 10:30:45
     ==================================================
     ```

3. **Test Cases:**
   - ✅ Invalid email
   - ✅ Valid email, wrong code
   - ✅ Valid code, expired code
   - ✅ Weak password validation
   - ✅ Password mismatch
   - ✅ Successful password reset

## TODO: Email Integration

Currently, reset codes are logged to console. To send actual emails:

1. **Install nodemailer:**
   ```bash
   npm install nodemailer
   ```

2. **Create email service:**
   ```javascript
   // Backend/services/emailService.js
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASSWORD
     }
   });
   
   exports.sendResetCode = async (email, code) => {
     await transporter.sendMail({
       from: process.env.EMAIL_USER,
       to: email,
       subject: 'Password Reset Code - PriorInboX',
       html: `Your reset code is: <strong>${code}</strong>`
     });
   };
   ```

3. **Update authController.js** to call `emailService.sendResetCode()`

4. **Add environment variables:**
   ```
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

## Storage & Data Flow

### Local Storage (Frontend):
- `resetEmail` - User's email during reset process
- `resetToken` - Temporary token from code verification

### Database (Backend):
- `reset_code` - 6-digit code
- `reset_token` - Token string
- `reset_expiry` - Expiration timestamp

## Error Handling

| Scenario | Frontend Shows | HTTP Status |
|----------|---|---|
| Email not found | Generic message | 200 (security) |
| Invalid code | "Invalid reset code" | 401 |
| Code expired | "Reset code has expired" | 401 |
| Token expired | "Reset token has expired" | 401 |
| Weak password | Password strength indicator | 400 |
| Server error | "Failed to connect to server" | 500 |

## User Experience Flow

```
🚀 Start: User clicks "Forgot password?" on login
   ↓
📧 Step 1: Enter email, receive 6-digit code
   ↓
✅ Step 2: Enter code to verify identity
   ↓
🔐 Step 3: Create new strong password
   ↓
✨ Success: Redirected to login with new password
```

## File Structure

```
Frontend/
  form/
    form-home.html          # Contains all HTML forms and JS functions

Backend/
  controllers/
    authController.js       # Password reset endpoints
  routes/
    authRoutes.js          # Password reset routes
  add-password-reset.js    # Database migration
```

## Summary

✅ **Implemented:**
- 3-step password reset flow
- 6-digit reset codes
- Code verification with expiry
- Secure password hashing
- Frontend validation and UX

⏳ **TODO:**
- Email sending via nodemailer
- Rate limiting to prevent brute force
- Password history (prevent reuse)
- Audit logging for security events
