# 🔐 Forgot Password - 5 Minute Quick Start

## ⚡ TL;DR - Just Want to Test It?

### Step 1: Run Migration (1 min)
```bash
cd Backend
node add-password-reset.js
```

Expected:
```
✅ Connected to database
✅ Added reset_code column
✅ Added reset_token column
✅ Added reset_expiry column
✅ All password reset columns added successfully
```

### Step 2: Start Backend (1 min)
```bash
npm start
```

Expected:
```
✅ Server running on http://localhost:5000
```

### Step 3: Open Frontend (1 min)
```
http://localhost:8000/form/form-home.html
```

### Step 4: Test (2 min)

1. **Click "Forgot password?" on login form**
2. **Enter email:** demo@priorinbox.com
3. **Check Backend console for code**
4. **Enter code in next form**
5. **Create new password**
6. **Login with new password** ✅

---

## 📝 Step-by-Step Testing

### Test 1: Successful Password Reset

**Location:** Backend terminal to see reset code

```
1. Go to http://localhost:8000/form/form-home.html
2. Click "Forgot password?" link
3. Enter email: demo@priorinbox.com
4. Click "Send Reset Code"
5. Check BACKEND TERMINAL - you'll see:

   ==================================================
   📧 PASSWORD RESET CODE FOR demo@priorinbox.com
   Reset Code: 123456
   Valid until: 2026-02-05 10:30:45
   ==================================================

6. Copy code (example: 123456)
7. Enter code in verify form
8. Click "Verify Code"
9. You'll see: "✅ Code Verified"
10. Enter new password (watch strength bar)
11. Confirm password matches
12. Click "Reset Password"
13. You'll see: "✅ Success"
14. Back on login form
15. Login with:
    - Email: demo@priorinbox.com
    - Password: (your new password) ✅
```

---

### Test 2: Wrong Code

```
1. Send reset code (see step 5 above for code)
2. Enter WRONG code (e.g., 000000)
3. Click "Verify Code"
4. See error: "❌ Invalid reset code"
5. Try again with correct code ✅
```

---

### Test 3: Weak Password

```
1. Get through code verification
2. Enter weak password: "123"
3. Watch strength indicator show "Weak password" in RED
4. Try to submit
5. See error: "❌ Password must be at least 6 characters"
6. Enter stronger password: "MyPassword123"
7. Watch strength indicator show "Strong password" in GREEN ✅
```

---

### Test 4: Password Mismatch

```
1. Get through code verification
2. Enter password: "MyPassword123"
3. Enter confirm: "DifferentPassword456"
4. Try to submit
5. See error: "❌ Passwords do not match"
6. Fix confirm password to match ✅
```

---

## 🔍 Finding the Reset Code

### Method 1: Backend Console (Recommended)
```
1. Look at Backend terminal window
2. Find the box with reset code:

   ==================================================
   📧 PASSWORD RESET CODE FOR email@example.com
   Reset Code: XXXXXX
   Valid until: YYYY-MM-DD HH:MM:SS
   ==================================================

3. Copy the code (6 digits)
```

### Method 2: Database Query
```sql
-- Connect to MySQL
mysql -u root -p
use priorinbox;

-- Find the reset code
SELECT email, reset_code, reset_expiry 
FROM users 
WHERE email = 'demo@priorinbox.com';
```

### Method 3: Browser DevTools
```javascript
// Open browser console (F12)
// The code is logged but you won't see it in browser
// It's only in Backend terminal
```

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Column 'reset_code' doesn't exist" | Run: `node add-password-reset.js` |
| "Cannot find /api/auth/forgot-password" | Restart backend: `npm start` |
| Form elements missing | Refresh browser (Ctrl+Shift+R) |
| Code doesn't appear | Look in BACKEND terminal, not browser |
| "Reset code has expired" | Code is only valid 30 minutes |
| "Reset token has expired" | Token is only valid 15 minutes |
| Button doesn't work | Check browser console for JS errors (F12) |
| Database connection error | Make sure MySQL is running |

---

## 📊 What's Happening Behind the Scenes

### Frontend Flow:
```
User clicks "Forgot password?"
    ↓
Enters email → Backend generates 6-digit code
    ↓
User enters code → Backend verifies and returns token
    ↓
User enters new password → Backend updates database
    ↓
User logs in with new password ✅
```

### Backend Flow:
```
POST /api/auth/forgot-password
├─ Generate 6-digit code
├─ Generate reset token
├─ Set 30-minute expiry
├─ Store in database
└─ Log to console

POST /api/auth/verify-reset-code
├─ Verify code is correct
├─ Check hasn't expired
├─ Generate JWT token (15 min)
└─ Return token to frontend

POST /api/auth/reset-password
├─ Verify token is valid
├─ Hash new password
├─ Update database
├─ Clear reset fields
└─ Return success
```

### Database:
```
Before: users table with username, email, password
After:  Same + reset_code, reset_token, reset_expiry

Reset Code Life:
- Generated when user requests
- Valid for 30 minutes
- Cleared after successful reset

Reset Token Life:
- Generated when code is verified
- Valid for 15 minutes
- Cleared after successful reset
```

---

## 🎯 Expected Output

### Backend Terminal (showing reset code):
```
==================================================
📧 PASSWORD RESET CODE FOR user@example.com
Reset Code: 456789
Valid until: 2026-02-05 10:45:30
==================================================
```

### Browser Modal (after each step):
```
Step 1: ✅ Code Sent
Step 2: ✅ Code Verified
Step 3: ✅ Success
```

### Login Success:
```
✅ Welcome Back
Welcome back, username!
[Redirects to home page]
```

---

## 🔒 Security Features

- ✅ **6-digit codes** - Random, hard to guess
- ✅ **30-minute expiry** - Code can't be used forever
- ✅ **15-minute token** - Token also expires
- ✅ **Bcrypt hashing** - Passwords hashed with 10 salt rounds
- ✅ **JWT verification** - Token is cryptographically signed
- ✅ **One-time use** - Codes cleared after use
- ✅ **Rate limiting** - Ready for implementation

---

## 📋 Files & Changes

**Modified:**
- ✅ `Frontend/form/form-home.html` - Added forgot password UI
- ✅ `Backend/controllers/authController.js` - Added 3 endpoints
- ✅ `Backend/routes/authRoutes.js` - Added 3 routes

**Created:**
- ✅ `Backend/add-password-reset.js` - Database migration
- ✅ `FORGOT_PASSWORD_*.md` - Documentation files

---

## 🚀 Next Steps

**Already Done:**
- ✅ Frontend forms and functions
- ✅ Backend endpoints
- ✅ Database schema
- ✅ Email code logging to console

**Optional (For Production):**
- ⏳ Send actual emails (nodemailer)
- ⏳ Rate limiting (prevent brute force)
- ⏳ Security questions
- ⏳ Audit logging

---

## 💡 Pro Tips

1. **Keep Backend terminal visible** - That's where the reset codes appear
2. **Codes are 6 random digits** - Example: 123456, 789012, etc.
3. **Code is valid 30 minutes** - Use it within 30 minutes
4. **Token is valid 15 minutes** - After verifying code
5. **Password must be 6+ characters** - Strength indicator helps
6. **Look at password strength bar** - Green = Good to use

---

## ✅ Success Indicators

When everything is working:

- [ ] "Forgot password?" link is visible on login form
- [ ] Clicking it shows forgot password form
- [ ] Entering email and clicking "Send Reset Code" shows success modal
- [ ] Reset code appears in Backend terminal
- [ ] Entering code in verify form works
- [ ] Password strength indicator updates in real-time
- [ ] Creating new password works
- [ ] Can login with new password
- [ ] Old password no longer works

---

## 🆘 Need Help?

Check these docs in order:

1. **FORGOT_PASSWORD_SETUP.md** - Detailed setup steps
2. **FORGOT_PASSWORD_GUIDE.md** - Complete technical docs
3. **FORGOT_PASSWORD_VISUAL.md** - UI/UX guide
4. **FORGOT_PASSWORD_CHANGES.md** - Code changes detail

---

## 🎉 Ready?

```bash
# Step 1
cd Backend
node add-password-reset.js

# Step 2
npm start

# Step 3
# Open http://localhost:8000/form/form-home.html

# Step 4
# Click "Forgot password?" and follow the flow!
```

**Enjoy your new forgot password feature! 🔐✨**
