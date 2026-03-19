# Email AI Intelligence - Architecture & System Design

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DASHBOARD                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Email AI Analyzer Component (Frontend)                  │  │
│  │  - One-click analysis button                            │  │
│  │  - Loading indicator                                    │  │
│  │  - Results display (analyzed, marked, success rate)    │  │
│  │  - Insights panel (toggleable)                         │  │
│  │  - Suggestions panel (toggleable)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────────────────────┐
              │   REST API Endpoints (3)      │
              │  JWT Authentication Required   │
              ├───────────────────────────────┤
              │ POST /api/ai/analyze-emails   │
              │ GET  /api/ai/email-insights   │
              │ GET  /api/ai/email-suggestions│
              └───────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │      Backend Controllers & Services     │
        │  ┌──────────────────────────────────┐   │
        │  │ aiController.js                  │   │
        │  │ - analyzeAndMarkImportantEmails  │   │
        │  │ - getEmailInsights               │   │
        │  │ - getEmailOrganizationSuggestions│   │
        │  └──────────────────────────────────┘   │
        │                    ↓                      │
        │  ┌──────────────────────────────────┐   │
        │  │ emailAIService.js                │   │
        │  │ - getImportanceScore()           │   │
        │  │ - analyzeEmailImportance()       │   │
        │  │ - categorizeEmail()              │   │
        │  └──────────────────────────────────┘   │
        └─────────────────────────────────────────┘
                              ↓
        ┌──────────────────────────────────────────┐
        │           MySQL Database                 │
        │  ┌────────────────┐  ┌──────────────┐   │
        │  │ emails table   │  │ tasks table  │   │
        │  │ - id           │  │ - id         │   │
        │  │ - user_id      │  │ - user_id    │   │
        │  │ - subject      │  │ - title      │   │
        │  │ - body         │  │ - priority   │   │
        │  │ - from_email   │  │ - due_date   │   │
        │  │ - is_important │  │ - status     │   │
        │  │ - category     │  │ - created_at │   │
        │  │ - created_at   │  └──────────────┘   │
        │  └────────────────┘                      │
        └──────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

### Analysis Request Flow

```
User clicks "Analyze Emails"
    ↓
Frontend: email-ai-analyzer.js
    │
    ├─ Show loading spinner
    ├─ Prepare API request
    └─ Add JWT token to headers
    ↓
POST /api/ai/analyze-emails
    ↓
Backend: aiController.analyzeAndMarkImportantEmails()
    │
    ├─ Verify JWT token
    ├─ Extract user_id from token
    ├─ Query emails: SELECT * FROM emails WHERE user_id = ? LIMIT 100
    └─ For each email:
    │   ├─ Extract: subject, body, from_email
    │   ├─ Call: emailAIService.getImportanceScore()
    │   │  │
    │   │  └─ Calculate score (0-100) using 7 categories
    │   │
    │   ├─ If score >= 30:
    │   │  └─ UPDATE emails SET is_important = 1 WHERE id = ?
    │   │
    │   └─ Store analysis: { id, subject, from, score, marked }
    │
    └─ Return response:
       {
         success: true,
         analyzed: 100,
         marked: 23,
         analysis: [...]
       }
    ↓
Frontend receives response
    │
    ├─ Display analyzed count
    ├─ Display marked count
    ├─ Calculate success rate
    └─ Hide loading spinner
    ↓
Display results panel with statistics
```

### Parallel Requests for Insights & Suggestions

```
After main analysis completes:

Parallel Request 1:
GET /api/ai/email-insights
    ↓
Calculate statistics:
- total_emails count
- important_count count
- importance_rate percentage
- Get top 10 senders with importance
- Count by category
    ↓
Return statistics object

Parallel Request 2:
GET /api/ai/email-suggestions
    ↓
Find missed important emails:
- Emails with keywords but not marked
    ↓
Find frequent important senders:
- Senders where >70% of emails are important
    ↓
Generate suggestions:
- "Mark these emails"
- "Consider these senders"
    ↓
Return suggestions array
```

## 🧠 Importance Scoring Algorithm

### Scoring Pipeline

```
Email Input
├─ Subject: "URGENT: Project deadline tomorrow"
├─ Body: "Action required immediately..."
└─ From: "boss@company.com"

    ↓

1. Tokenize & Process
   └─ Split into words: ["urgent", "project", "deadline", "tomorrow", ...]
   └─ Lowercase: "urgent", "deadline", "action", "immediately"
   └─ Remove special chars

    ↓

2. Category Matching (7 Categories)
   ├─ [1] Urgent Keywords
   │  └─ Match: "urgent", "immediately"
   │  └─ Points: 35 + 5 = 40 pts
   │
   ├─ [2] Deadline Keywords
   │  └─ Match: "deadline"
   │  └─ Points: 22 pts
   │
   ├─ [3] Opportunity Keywords
   │  └─ Match: none
   │  └─ Points: 0 pts
   │
   ├─ [4] Action Keywords
   │  └─ Match: "action required"
   │  └─ Points: 25 pts
   │
   ├─ [5] Meeting Keywords
   │  └─ Match: none
   │  └─ Points: 0 pts
   │
   ├─ [6] Financial Keywords
   │  └─ Match: none
   │  └─ Points: 0 pts
   │
   └─ [7] Security Keywords
      └─ Match: none
      └─ Points: 0 pts

    ↓

3. Sender Analysis
   ├─ From: "boss@company.com"
   ├─ Parse name: "boss"
   ├─ Check: Is "boss" in importantSenderPatterns?
   └─ YES → Add 15 points

    ↓

4. Content Signals
   ├─ Subject length: 35 chars (reasonable)
   │  └─ Neutral: 0 pts
   │
   ├─ Contains ALL CAPS: YES
   │  └─ Points: 5 pts (emphasis)
   │
   ├─ Body length: 100+ chars
   │  └─ Points: 5 pts (detailed)
   │
   └─ Punctuation intensity: 2 exclamation marks
      └─ Points: 3 pts (emphasis)

    ↓

5. Spam Detection
   ├─ Check: "promotional" pattern? NO
   ├─ Check: "unsubscribe" link? NO
   ├─ Check: marketing keywords? NO
   └─ Spam penalty: 0 pts

    ↓

6. Final Score Calculation
   Total = Urgent(40) + Deadline(22) + Action(25) + Sender(15) 
           + CAPS(5) + Body Length(5) + Punctuation(3)
         = 115 points
   
   Clamp to 0-100: 100 points

    ↓

7. Importance Check
   Is score >= 30 (threshold)?
   100 >= 30? YES ✓
   
   Result: Email marked as IMPORTANT

    ↓

Output: { score: 100, is_important: true }
```

## 🔄 Component Interaction Diagram

### Module Dependencies

```
Frontend Components:
├─ priorInboX-home.html
│  └─ includes → email-ai-analyzer.js
│               └─ depends on → priorInboX-home.css
│
└─ email-ai-analyzer.js
   ├─ Calls → POST /api/ai/analyze-emails
   ├─ Calls → GET /api/ai/email-insights
   └─ Calls → GET /api/ai/email-suggestions

Backend Components:
├─ aiRoutes.js
│  ├─ Registers → POST /api/ai/analyze-emails
│  │             → aiController.analyzeAndMarkImportantEmails
│  │
│  ├─ Registers → GET /api/ai/email-insights
│  │             → aiController.getEmailInsights
│  │
│  └─ Registers → GET /api/ai/email-suggestions
│                 → aiController.getEmailOrganizationSuggestions
│
├─ aiController.js
│  └─ Uses → emailAIService (for scoring)
│           → database pool (for queries)
│
├─ emailAIService.js
│  ├─ Exports → getImportanceScore()
│  ├─ Exports → analyzeEmailImportance()
│  └─ Exports → categorizeEmail()
│
└─ email database
   └─ Tables: emails, tasks, calendar_events
```

## 🔐 Authentication Flow

```
User Login
    ↓
Generate JWT Token
    └─ Payload: { user_id, email, iat, exp }
    └─ Sign with secret key
    └─ Store in localStorage
    ↓
When calling AI endpoints:
    │
    └─ Include header: Authorization: Bearer {token}
    ↓
Backend: verifyToken middleware
    │
    ├─ Extract token from header
    ├─ Verify signature with secret key
    ├─ Check expiration (exp claim)
    ├─ Extract user_id from payload
    └─ Attach to request object: req.user.id
    ↓
AI Controller
    │
    ├─ Receive authenticated user_id
    ├─ Query emails WHERE user_id = authenticated_user_id
    ├─ Only process that user's emails
    └─ Return only their data
    ↓
Response sent only to authenticated user
```

## 📈 Database Schema Relationships

```
┌──────────────────────────────┐
│         users table          │
├──────────────────────────────┤
│ id (PK)                      │
│ email                        │
│ password_hash                │
│ created_at                   │
│ updated_at                   │
└───────────────┬──────────────┘
                │ (1 to many)
                │
        ┌───────┴─────────────────────────┬─────────────────┐
        ↓                                 ↓                 ↓
┌──────────────────┐  ┌────────────────────┐  ┌──────────────────────┐
│  emails table    │  │  tasks table       │  │ calendar_events      │
├──────────────────┤  ├────────────────────┤  ├──────────────────────┤
│ id (PK)          │  │ id (PK)            │  │ id (PK)              │
│ user_id (FK)     │  │ user_id (FK)       │  │ user_id (FK)         │
│ subject          │  │ title              │  │ title                │
│ body             │  │ description        │  │ description          │
│ from_email       │  │ priority           │  │ start_date           │
│ from_name        │  │ due_date           │  │ end_date             │
│ category         │  │ status             │  │ reminder_minutes     │
│ is_important ←───┤─ │ email_id (FK)      │  │ color                │
│ created_at       │  │ created_at         │  │ created_at           │
│ updated_at       │  │ updated_at         │  │ updated_at           │
└──────────────────┘  └────────────────────┘  └──────────────────────┘
       ↑                      ↑
       │──────────────────────│
   Important emails can
   have associated tasks
```

## 🎨 Frontend Component Structure

```
Email AI Analyzer Component
├─ Constructor(containerSelector)
│  └─ Initialize UI
│
├─ initUI()
│  └─ Create analysis panel
│  └─ Attach event listeners
│
├─ createAnalysisPanel()
│  ├─ Create control panel div
│  ├─ Add analyze button
│  ├─ Create results container
│  ├─ Create insights section
│  ├─ Create suggestions section
│  └─ Insert into DOM
│
├─ analyzeEmails()
│  ├─ Show loading indicator
│  ├─ Fetch POST /api/ai/analyze-emails
│  ├─ Fetch GET /api/ai/email-insights (parallel)
│  ├─ Fetch GET /api/ai/email-suggestions (parallel)
│  ├─ Display results
│  └─ Hide loading, show results
│
├─ displayAnalysisResults(data)
│  ├─ Update analyzed count
│  ├─ Update marked count
│  ├─ Calculate success rate
│  └─ Trigger displayInsights/Suggestions
│
├─ displayInsights(statistics)
│  ├─ Show total emails
│  ├─ Show important count
│  ├─ Show importance percentage
│  ├─ List top senders
│  └─ Show category breakdown
│
├─ displaySuggestions(suggestions)
│  ├─ Show missed important emails
│  ├─ Show frequent important senders
│  └─ Show actionable items
│
├─ closeResults()
│  └─ Hide results panel
│  └─ Re-enable analyze button
│
└─ Helper methods
   ├─ escapeHtml(text)
   └─ capitalizeFirst(str)
```

## ⚙️ Configuration Points

### Backend Configuration

**File**: `Backend/services/emailAIService.js`

```javascript
// Line ~30: Importance Threshold
const IMPORTANCE_THRESHOLD = 30;  // Change to adjust sensitivity
// Lower = more emails marked
// Higher = fewer emails marked

// Lines ~50-120: Keyword Weights
const URGENT_WEIGHT = 35;         // Urgent keyword points
const DEADLINE_WEIGHT = 22;       // Deadline keyword points
const OPPORTUNITY_WEIGHT = 30;    // Opportunity keyword points
const ACTION_WEIGHT = 25;         // Action keyword points
const MEETING_WEIGHT = 15;        // Meeting keyword points
const FINANCIAL_WEIGHT = 18;      // Financial keyword points
const SECURITY_WEIGHT = 35;       // Security keyword points
const SENDER_BONUS = 15;          // Important sender bonus

// Lines ~130-140: Keyword Lists
const urgentKeywords = [
  'critical', 'emergency', 'urgent', 'asap', 'immediately'
];
// Add/remove keywords here

// Lines ~140-150: Important Senders
const importantSenderPatterns = [
  'boss', 'manager', 'ceo', 'director', 'executive',
  'hr@', 'linkedin', 'jobs@', 'recruiter'
];
// Add VIP senders here

// Line ~200+: Spam Patterns
const spamPatterns = [
  'promotional', 'marketing', 'limited time'
];
// Add spam keywords here
```

### Frontend Configuration

**File**: `Frontend/email-ai-analyzer.js`

```javascript
// Line 8: Container selector
constructor(containerSelector = '.dashboard')
// Change to target different element

// Line ~180: Analysis request path
fetch('/api/ai/analyze-emails', ...)
// Change if API path different

// Line ~200: Insight request path
fetch('/api/ai/email-insights', ...)
// Change if API path different

// Line ~210: Suggestion request path
fetch('/api/ai/email-suggestions', ...)
// Change if API path different
```

### CSS Customization

**File**: `Frontend/priorInboX-home.css`

```css
/* Lines ~4056: Primary Colors */
.email-ai-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change colors to match branding */
}

/* Lines ~4100: Text Color */
.ai-stat-value {
  color: #667eea;
  /* Change accent color */
}

/* Lines ~4200: Responsive Breakpoints */
@media (max-width: 768px) { ... }   /* Tablet */
@media (max-width: 480px) { ... }   /* Mobile */
/* Adjust breakpoints for different devices */
```

## 🔍 Debugging & Monitoring

### Server-Side Logging

```javascript
// In aiController.js - add console logs
console.log(`[AI Analysis] User: ${userId}, Emails: ${emails.length}`);
console.log(`[AI Scoring] Email: ${subject}, Score: ${score}`);
console.log(`[AI Marked] ${markedCount} of ${totalCount} emails`);
```

### Client-Side Debugging

```javascript
// In browser console
// Check token
console.log(localStorage.getItem('token'));

// Check API response
fetch('/api/ai/analyze-emails', {...})
  .then(r => r.json())
  .then(d => console.log(d));

// Check component initialization
console.log(window.emailAIAnalyzer);
```

### Database Monitoring

```sql
-- Check emails marked in last analysis
SELECT COUNT(*) FROM emails WHERE is_important = 1;

-- Check importance distribution
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) as important,
  ROUND(100 * SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as percentage
FROM emails;

-- Top senders
SELECT from_email, COUNT(*) as total,
  SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) as important
FROM emails
GROUP BY from_email
ORDER BY important DESC
LIMIT 10;
```

## 🚀 Performance Optimization

### Current Performance
- Analysis of 100 emails: 2-3 seconds
- Memory usage: ~5-10MB
- Database queries: 2-3 per analysis

### Optimization Opportunities

**1. Caching**
```javascript
// Cache scoring results for same emails
const scoreCache = new Map();
const cacheKey = `${subject}_${fromEmail}`;
if (scoreCache.has(cacheKey)) {
  return scoreCache.get(cacheKey);
}
```

**2. Batch Database Updates**
```javascript
// Update all marked emails in one query
const markedIds = analysis
  .filter(e => e.score >= 30)
  .map(e => e.id);
// UPDATE emails SET is_important = 1 WHERE id IN (...)
```

**3. Reduce Email Limit**
```javascript
// Analyze fewer emails for faster response
const limit = 50;  // Reduced from 100
emails = emails.slice(0, limit);
```

**4. Worker Threads**
```javascript
// Off-load scoring to worker thread
const worker = new Worker('scorer.js');
worker.postMessage(emails);
```

---

**Document Version**: 1.0
**Last Updated**: Current Implementation
**Status**: Architecture Complete ✅
