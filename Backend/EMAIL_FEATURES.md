# Email Integration & AI Features

## New Features Added

### 1. Email Account Management
- Connect multiple email accounts (Gmail, Outlook, Yahoo)
- Disconnect email accounts
- View all connected accounts
- Track last sync time

### 2. Email Processing
- Store emails in database
- Mark emails as important
- Mark emails as read
- Create tasks directly from emails

### 3. AI-Powered Email Analysis
The system automatically:
- **Identifies Important Emails** - Using keyword analysis (urgent, deadline, interview, etc.)
- **Extracts Tasks** - Parses email content for actionable tasks
- **Creates Calendar Events** - Extracts dates and times from emails
- **Categorizes Emails** - Analyzes urgency and importance

### 4. Task Management Enhancements
- Create tasks from emails
- Link tasks to source emails
- 3-month task history
- Filter by incomplete/completed tasks
- Task animations when completed

## API Endpoints

### Email Accounts
```
GET    /api/email-accounts          - Get all connected accounts
POST   /api/email-accounts          - Connect new email account
DELETE /api/email-accounts/:id      - Disconnect account
```

### Emails
```
GET    /api/emails?filter=important - Get emails (filter: important, unread, all)
PUT    /api/emails/:id/important    - Mark email as important
PUT    /api/emails/:id/read         - Mark email as read
POST   /api/emails/:id/create-task  - Create task from email
```

## Database Schema

### email_accounts Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- email (Email address)
- provider (gmail, outlook, yahoo, other)
- access_token (OAuth token)
- refresh_token (For token refresh)
- is_connected (Boolean)
- last_synced (Timestamp)
- created_at
- updated_at
```

### emails Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- email_account_id (Foreign Key)
- from_address
- subject
- body
- message_id (Unique)
- is_read (Boolean)
- is_important (Boolean)
- created_at
```

### tasks Table (Enhanced)
```sql
- source_email_id (Reference to original email)
- All existing fields...
```

## Email AI Service

### How It Works

**1. Importance Analysis**
- Scans subject and body for keywords
- Weights: urgent, asap, deadline, interview, offer, approval, etc.
- Importance score ≥ 10 marks as important

**2. Task Extraction**
- Uses regex patterns to find task descriptions
- Patterns: "please [action]", "need [task]", "task: [description]"
- Automatically sets priority as "medium"

**3. Calendar Event Extraction**
- Finds date patterns (MM/DD/YYYY, DD-MM-YYYY)
- Finds time patterns (HH:MM AM/PM)
- Creates calendar events from meeting mentions

## Usage Examples

### Connect Email Account
```javascript
POST /api/email-accounts
{
  "email": "user@gmail.com",
  "provider": "gmail",
  "access_token": "token_here",
  "refresh_token": "refresh_token_here"
}
```

### Get Important Emails
```javascript
GET /api/emails?filter=important
```

### Create Task from Email
```javascript
POST /api/emails/123/create-task
{
  "title": "Review proposal",
  "priority": "high",
  "due_date": "2025-01-15"
}
```

### Mark Email as Important
```javascript
PUT /api/emails/123/important
{
  "is_important": true
}
```

## Frontend Integration

### Display Important Emails
```javascript
const response = await fetch('/api/emails?filter=important', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const importantEmails = await response.json();
```

### Show 3-Month Task History
```javascript
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

const tasks = allTasks.filter(task => 
  new Date(task.created_at) >= threeMonthsAgo
);
```

### Task Animations
- Use CSS transitions for smooth slides
- On complete, slide task to completed column
- Add completion checkmark animation

## Future Enhancements

1. **OAuth Integration**
   - Google Gmail API integration
   - Microsoft Outlook API
   - Yahoo Mail API

2. **Advanced AI**
   - NLP for better task extraction
   - Sentiment analysis
   - Email spam detection
   - Auto-categorization

3. **Email Sync Service**
   - Background sync every 5 minutes
   - Incremental sync (only new emails)
   - Retry failed syncs

4. **Notifications**
   - Real-time email notifications
   - Urgent email alerts
   - Task reminders

5. **Email Management**
   - Archive emails
   - Delete emails
   - Search functionality
   - Full-text search

## Security Notes

- Store access tokens securely (encrypted)
- Refresh tokens automatically
- Validate email headers to prevent spoofing
- Rate limit email sync operations
- Never expose user credentials

## Performance Optimization

- Index on user_id, created_at
- Paginate email results (50 per page)
- Cache important emails in memory
- Batch sync operations
- Clean up old emails (archive after 6 months)
