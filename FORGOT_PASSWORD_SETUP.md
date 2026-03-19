# Forgot Password - Quick Setup & Testing

## Quick Setup (5 minutes)

### Step 1: Run Database Migration
```bash
cd Backend
node add-password-reset.js
```

**Expected Output:**
```
✅ Connected to database
✅ Added reset_code column
✅ Added reset_token column
✅ Added reset_expiry column
✅ All password reset columns added successfully
```

### Step 2: Start Backend Server
```bash
npm start
# Server running on http://localhost:5000
```

### Step 3: Open Frontend
```
http://localhost:8000/form/form-home.html
```

## Testing the Feature

### Test Scenario 1: Successful Password Reset

**Step 1: Click "Forgot password?"**
- On login form, click the "Forgot password?" link
- Should navigate to forgot password form

**Step 2: Enter Email**
- Enter an email that's registered in the system
- Click "Send Reset Code"
- You should see: "✅ Code Sent" message
- Check **Backend Console** for the reset code

**Step 3: Verify Code**
- Copy code from Backend Console
- Enter code in the verify form
- Click "Verify Code"
- You should see: "✅ Code Verified" message

**Step 4: Reset Password**
- Enter new password (watch strength indicator)
- Confirm password
- Click "Reset Password"
- You should see: "✅ Success" message
- You're redirected to login form

**Step 5: Login with New Password**
- Enter email and new password
- Should login successfully

---

### Test Scenario 2: Invalid Code

**Steps:**
1. Click "Forgot password?" → Enter email → "Send Reset Code"
2. Enter WRONG code (e.g., 000000)
3. Click "Verify Code"
4. Should see: ❌ Invalid reset code error

---

### Test Scenario 3: Expired Code

**Steps:**
1. Send reset code
2. Wait 31 minutes (or modify code to shorter expiry)
3. Try to use the code
4. Should see: ❌ Reset code has expired error

---

### Test Scenario 4: Weak Password

**Steps:**
1. Go through steps 1-3 (get verified)
2. Enter weak password: "123"
3. Try to submit
4. Should see: ❌ Password must be at least 6 characters
5. Watch the strength indicator change as you type

---

### Test Scenario 5: Password Mismatch

**Steps:**
1. Go through steps 1-3 (get verified)
2. Enter password: "MyPassword123"
3. Enter confirm: "DifferentPassword123"
4. Try to submit
5. Should see: ❌ Passwords do not match

---

## Backend Console Output Examples

### When User Requests Reset Code:
```
==================================================
📧 PASSWORD RESET CODE FOR user@example.com
Reset Code: 456789
Valid until: 2026-02-05 10:45:30
==================================================
```

Copy the code and use it in Step 3 above.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find form element" | Make sure frontend form-home.html is updated |
| "Cannot POST /api/auth/forgot-password" | Make sure Backend routes are updated |
| "Column 'reset_code' doesn't exist" | Run `node add-password-reset.js` |
| Code doesn't show in console | Check Backend terminal output, not browser console |
| "Reset token has expired" | Code is valid for 30 min, token is valid for 15 min |

---

## API Testing with cURL

### Test 1: Request Reset Code
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Test 2: Verify Code
```bash
curl -X POST http://localhost:5000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'
```

### Test 3: Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "resetToken":"<token-from-verify>",
    "newPassword":"NewPassword123"
  }'
```

---

## Code Location Reference

| Component | File | Lines |
|-----------|------|-------|
| Frontend Forms | `Frontend/form/form-home.html` | 365-430 |
| Frontend Functions | `Frontend/form/form-home.html` | 815-980 |
| Backend Endpoints | `Backend/controllers/authController.js` | 310+ |
| Routes | `Backend/routes/authRoutes.js` | 9-13 |
| Database Migration | `Backend/add-password-reset.js` | - |

---

## Next Steps (Optional)

1. **Add Email Sending**
   - Install nodemailer
   - Create email service
   - Send actual emails instead of logging to console

2. **Add Rate Limiting**
   - Limit reset requests per IP/email
   - Prevent brute force attacks

3. **Add Audit Logging**
   - Log all password reset attempts
   - Track suspicious activity

4. **Add Security Questions**
   - Additional verification method
   - Ask custom security questions

---

## Feature Checklist

- ✅ Frontend "Forgot Password" link
- ✅ 3-step password reset flow
- ✅ 6-digit reset code generation
- ✅ Code verification with expiry
- ✅ Temporary reset token (JWT)
- ✅ Password strength validation
- ✅ Secure password hashing
- ✅ Error handling & user feedback
- ✅ Modal dialogs for UX
- ⏳ Email sending (TODO)
- ⏳ Rate limiting (TODO)
- ⏳ Security questions (TODO)

---

## Questions?

Check `FORGOT_PASSWORD_GUIDE.md` for complete documentation.
