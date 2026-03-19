# PriorInBox Backend - Node.js + Express + MySQL

A complete backend API for the PriorInBox email and task management system.

## Features

- 🔐 User Authentication (Register/Login with JWT)
- 📋 Task Management (Create, Read, Update, Delete)
- 📅 Calendar Events Management
- 📧 Email Storage & Management
- 🔒 Protected Routes with JWT Token
- 🗄️ MySQL Database Integration
- ⚡ RESTful API Architecture

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up MySQL database:
   - Open MySQL and run the SQL commands from `database.sql`
   - Or: `mysql -u root -p < database.sql`

3. Configure environment variables:
   - Copy `.env` file and update with your MySQL credentials:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=priorinbox
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)

### Tasks
- `GET /api/tasks` - Get all tasks (Protected)
- `POST /api/tasks` - Create new task (Protected)
- `PUT /api/tasks/:id` - Update task (Protected)
- `DELETE /api/tasks/:id` - Delete task (Protected)

### Calendar
- `GET /api/calendar` - Get all events (Protected)
- `POST /api/calendar` - Create new event (Protected)
- `PUT /api/calendar/:id` - Update event (Protected)
- `DELETE /api/calendar/:id` - Delete event (Protected)

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
Backend/
├── config/
│   └── database.js         # MySQL connection config
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── taskController.js   # Task operations
│   └── calendarController.js # Calendar operations
├── middleware/
│   └── auth.js            # JWT verification middleware
├── routes/
│   ├── authRoutes.js      # Auth endpoints
│   ├── taskRoutes.js      # Task endpoints
│   └── calendarRoutes.js  # Calendar endpoints
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
└── database.sql           # Database schema
```

## Example Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete Frontend",
    "description": "Finish the calendar component",
    "priority": "high",
    "due_date": "2025-01-15"
  }'
```

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention (using prepared statements)
- ✅ User data isolation (users can only access their own data)

## Dependencies

- **express**: Web framework
- **mysql2**: MySQL database driver
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variables
- **express-validator**: Input validation
- **nodemon**: Development auto-reload

## License

MIT
