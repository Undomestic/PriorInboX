-- =====================================================
-- MyPanel - Enhanced Database Schema with AI Features
-- =====================================================

-- Enhanced users table with AI profile
ALTER TABLE users ADD COLUMN (
  profile_picture VARCHAR(500),
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(20) DEFAULT 'dark',
  notification_preferences JSON,
  ai_profile JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Email sentiment & content analysis
CREATE TABLE IF NOT EXISTS email_sentiment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email_id INT NOT NULL,
  sentiment VARCHAR(50), -- 'positive', 'negative', 'neutral'
  sentiment_score DECIMAL(3,2),
  urgency_score DECIMAL(3,2), -- 0 to 1
  mention_keywords JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  INDEX idx_email (email_id)
);

-- Enhanced emails table
ALTER TABLE emails ADD COLUMN (
  importance_score DECIMAL(3,2) DEFAULT 0,
  is_important BOOLEAN DEFAULT FALSE,
  is_spam BOOLEAN DEFAULT FALSE,
  category VARCHAR(50), -- 'work', 'personal', 'promotion', 'social'
  has_actionable_items BOOLEAN DEFAULT FALSE,
  actionable_items_json JSON,
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  user_labeled BOOLEAN DEFAULT FALSE,
  INDEX idx_importance (is_important),
  INDEX idx_category (category)
);

-- Task extractions tracking
CREATE TABLE IF NOT EXISTS task_extractions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  email_id INT NOT NULL,
  task_id INT,
  extracted_text TEXT,
  extraction_method VARCHAR(50), -- 'regex', 'nlp', 'ml'
  confidence_score DECIMAL(3,2),
  user_approved BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  INDEX idx_user_email (user_id, email_id)
);

-- Enhanced tasks table
ALTER TABLE tasks ADD COLUMN (
  source_type VARCHAR(50), -- 'manual', 'email_extraction', 'calendar'
  source_email_id INT,
  ai_priority_score DECIMAL(3,2),
  ai_confidence DECIMAL(3,2),
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_before_hours INT DEFAULT 24,
  completed_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  FOREIGN KEY (source_email_id) REFERENCES emails(id),
  INDEX idx_extraction (source_type)
);

-- Task history for AI learning
CREATE TABLE IF NOT EXISTS task_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  action VARCHAR(50), -- 'created', 'updated', 'completed', 'archived'
  old_value JSON,
  new_value JSON,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_task (task_id)
);

-- User behavior learning
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  emails_marked_important INT DEFAULT 0,
  emails_marked_spam INT DEFAULT 0,
  avg_email_response_time_hours INT,
  preferred_email_categories JSON,
  avg_task_completion_rate DECIMAL(3,2),
  avg_task_completion_time_days INT,
  priority_distribution JSON,
  weekday_productivity JSON,
  peak_work_hours JSON,
  timezone VARCHAR(50),
  preferred_task_types JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ML model predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  task_id INT,
  email_id INT,
  prediction_type VARCHAR(50), -- 'importance', 'priority', 'completion_date'
  predicted_value VARCHAR(255),
  confidence DECIMAL(3,2),
  actual_value VARCHAR(255),
  accuracy_feedback BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (email_id) REFERENCES emails(id),
  INDEX idx_user_predictions (user_id, created_at)
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50), -- 'deadline_reminder', 'new_important_email', 'overdue_task'
  title VARCHAR(255),
  message TEXT,
  reference_task_id INT,
  reference_email_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  delivery_channels JSON,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reference_task_id) REFERENCES tasks(id),
  FOREIGN KEY (reference_email_id) REFERENCES emails(id),
  INDEX idx_user_unread (user_id, is_read)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  deadline_reminders BOOLEAN DEFAULT TRUE,
  new_email_alerts BOOLEAN DEFAULT TRUE,
  important_email_alerts BOOLEAN DEFAULT TRUE,
  overdue_task_reminders BOOLEAN DEFAULT TRUE,
  daily_summary BOOLEAN DEFAULT TRUE,
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced calendar events
ALTER TABLE calendar_events ADD COLUMN (
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_before_minutes INT DEFAULT 15,
  color VARCHAR(20),
  attendees JSON,
  INDEX idx_user_date (user_id, start_time)
);

-- Email attachments
CREATE TABLE IF NOT EXISTS email_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email_id INT NOT NULL,
  filename VARCHAR(500),
  file_size INT,
  mime_type VARCHAR(100),
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  INDEX idx_email (email_id)
);

-- Create indices for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_email_accounts_user ON email_accounts(user_id);
CREATE INDEX idx_emails_user_received ON emails(user_id, received_at);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);
CREATE INDEX idx_calendar_user_date ON calendar_events(user_id, start_time);

-- Analytics views
CREATE OR REPLACE VIEW user_productivity_stats AS
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'pending' AND t.due_date < CURDATE() THEN t.id END) as overdue_tasks,
  COUNT(DISTINCT e.id) as total_emails,
  COUNT(DISTINCT CASE WHEN e.is_important THEN e.id END) as important_emails,
  ROUND(COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) / COUNT(DISTINCT t.id) * 100, 2) as completion_rate
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN emails e ON u.id = e.user_id
GROUP BY u.id, u.username;

-- Summary view
SHOW TABLES;
DESCRIBE email_sentiment;
DESCRIBE ai_learning_data;
DESCRIBE ai_predictions;
DESCRIBE notifications;
