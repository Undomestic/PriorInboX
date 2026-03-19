# PriorInBox - Complete Setup Guide

## ✅ System Status

### Backend
- **Server**: Running on `http://localhost:5000`
- **Database**: MySQL connected (priorinbox)
- **API Status**: ✅ All endpoints working

### Frontend
- **Entry Point**: `index.html` (Login/Signup)
- **Dashboard**: `priorInboX-home.html` (Home page)
- **Emails**: `emails.html` (View all connected emails)
- **Settings**: `account-settings.html` (Account management)

---

## 🚀 Quick Start

### 1. Open Frontend
Navigate to: `file:///F:/PriorInboX/Frontend/index.html`

Or serve via local server:
```bash
cd F:\PriorInboX\Frontend
python -m http.server 8000
# Then visit: http://localhost:8000/index.html
```

### 2. Login Credentials
**Demo Account Created:**
- **Email**: `demo@priorinbox.com`
- **Password**: `Demo@123`
- **Username**: `demo`

### 3. Create New Account
- Click "Sign Up" on the login form
- Enter username, email, and password
- Account will be created and auto-login

---

## 📋 Features

### Authentication
✅ User Registration
✅ User Login with JWT
✅ Token-based session management
✅ Auto-redirect based on auth status

### Dashboard (Home)
✅ Welcome greeting with user data
✅ Tasks card
✅ Important emails
✅ Mini calendar
✅ Full-screen calendar modal
✅ Footer (100% width)
✅ Theme toggle (Dark/Light mode)
✅ Logout functionality

### Email Management (`emails.html`)
✅ View all connected email accounts
✅ Display emails from each account
✅ Filter emails (All, Important, Unread)
✅ Search and sort functionality
✅ Email detail view modal
✅ Important email badge (⭐)
✅ Refresh emails

### Account Settings (`account-settings.html`)
✅ View profile information
✅ Update username
✅ Change password
✅ Theme preferences
✅ Email notification settings
✅ Delete account (with confirmation)

---

## 🔧 Backend API Endpoints

### Authentication
```
POST   /api/auth/register       - Create new account
POST   /api/auth/login          - Login user
GET    /api/auth/profile        - Get user profile (Protected)
POST   /api/auth/update-profile - Update username (Protected)
POST   /api/auth/change-password - Change password (Protected)
DELETE /api/auth/delete-account - Delete account (Protected)
```

### Tasks
```
GET    /api/tasks               - Get all user tasks
POST   /api/tasks               - Create new task
PUT    /api/tasks/:id           - Update task
DELETE /api/tasks/:id           - Delete task
```

### Calendar
```
GET    /api/calendar            - Get all events
POST   /api/calendar            - Create event
PUT    /api/calendar/:id        - Update event
DELETE /api/calendar/:id        - Delete event
```

### Emails
```
GET    /api/emails              - Get user emails
POST   /api/emails/:id/mark-important - Mark email as important
```

### Email Accounts
```
GET    /api/email-accounts      - Get all accounts
POST   /api/email-accounts      - Connect new account
DELETE /api/email-accounts/:id  - Disconnect account
```

---

## 🐛 Troubleshooting

### Login/Signup Not Working?
1. Make sure backend is running: `npm run dev` in `F:\PriorInboX\Backend`
2. Check if port 5000 is available
3. Verify MySQL is running
4. Open browser console (F12) to see error messages

### Backend Not Starting?
```bash
cd F:\PriorInboX\Backend

# Kill existing process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Start backend
npm run dev
```

### Database Issues?
```bash
# Reset database
npm run setup
```

### CORS Errors?
- Backend has CORS enabled on all routes
- Make sure frontend is accessing via `http://localhost:5000`
- Check that API URL in frontend is correct

---

## 📁 Project Structure

```
F:\PriorInboX\
├── Backend/
│   ├── server.js
│   ├── config/database.js
│   ├── middleware/auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   ├── calendarController.js
│   │   ├── emailController.js
│   │   └── emailAccountController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── calendarRoutes.js
│   │   ├── emailRoutes.js
│   │   └── emailAccountRoutes.js
│   ├── services/emailAIService.js
│   ├── .env
│   ├── package.json
│   └── database.sql
│
└── Frontend/
    ├── index.html (Login/Signup)
    ├── priorInboX-home.html (Dashboard)
    ├── emails.html (Email management)
    ├── account-settings.html (Settings)
    ├── priorInboX-home.css
    ├── home-scrpit.js
    └── form/
        └── form-home.html
```

---

## 🎯 Next Steps

1. **Test Login**: Use demo account credentials
2. **Explore Dashboard**: View home page with calendar and tasks
3. **Check Emails**: Browse your connected email accounts
4. **Update Profile**: Change username or password in settings
5. **Toggle Theme**: Try dark/light mode

---

## 📞 Support

For issues:
1. Check browser console (F12)
2. Check terminal output for backend errors
3. Verify all services are running
4. Review endpoint URLs and API responses

---

**Happy coding! 🚀**
