/**
 * Important Emails Dashboard Manager
 * Automatically loads important emails and creates tasks/calendar events
 */

const API_URL = 'http://localhost:5000/api';

class ImportantEmailsManager {
  constructor() {
    this.importantEmails = [];
    // Immediately load important emails instead of waiting for another DOMContentLoaded
    this.loadImportantEmails();
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  }

  // Get user info
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Load important emails from API
  async loadImportantEmails() {
    try {
      const token = this.getToken();
      console.log('🔍 Important Emails Manager - Token found:', !!token);
      
      if (!token) {
        console.warn('⚠️ No authentication token found, skipping important emails load');
        return;
      }

      console.log('📡 Fetching important emails from API...');
      const response = await fetch(`${API_URL}/emails/important`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const emails = await response.json();
      console.log('✅ Fetched emails:', emails.length);
      
      this.importantEmails = emails.slice(0, 5); // Show top 5 important emails

      this.displayImportantEmails();
      
      // Auto-create tasks and calendar events for important emails
      this.autoCreateTasksAndEvents();
    } catch (error) {
      console.error('❌ Error loading important emails:', error);
      this.showErrorMessage('Failed to load important emails');
    }
  }

  // Display important emails on dashboard
  displayImportantEmails() {
    const mailsList = document.getElementById('importantMailsList');
    const countElement = document.getElementById('importantEmailsCount');
    
    console.log('🎨 Displaying important emails - mailsList element found:', !!mailsList);
    console.log('📍 Important emails count:', this.importantEmails.length);
    
    if (!mailsList) {
      console.error('❌ Element #importantMailsList not found in DOM!');
      return;
    }

    if (this.importantEmails.length === 0) {
      mailsList.innerHTML = `
        <div class="important-mails-empty">
          <div class="important-mails-empty-icon">📭</div>
          <div class="important-mails-empty-text">
            <p>No important emails yet</p>
            <p style="font-size: 12px; margin-top: 4px;">Mark emails as important to see them here</p>
          </div>
        </div>
      `;
      if (countElement) countElement.textContent = '0';
      return;
    }

    if (countElement) countElement.textContent = this.importantEmails.length;

    const topEmails = this.importantEmails.slice(0, 5);

    mailsList.innerHTML = topEmails.map(email => {
      const date = new Date(email.received_at || email.created_at);
      const timeStr = this.formatEmailTime(date);
      const senderName = this.extractSender(email.from_address);
      const preview = this.getEmailPreview(email.body, 60);

      return `
        <div class="important-mail-row" data-email-id="${email.id}">
          <div class="important-mail-icon">⭐</div>
          <div class="important-mail-content">
            <div class="important-mail-from">${this.escapeHtml(senderName)}</div>
            <div class="important-mail-subject">${this.escapeHtml(email.subject)}</div>
            <div class="important-mail-preview">${this.escapeHtml(preview)}</div>
          </div>
          <div class="important-mail-time">${timeStr}</div>
          <div class="important-mail-actions">
            <button class="important-action-btn task-btn" title="Create Task" data-action="create-task">📋</button>
            <button class="important-action-btn calendar-btn" title="Add to Calendar" data-action="create-calendar">📅</button>
            <button class="important-action-btn view-btn" title="View Email" data-action="view-email">→</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners
    this.attachActionListeners();
  }

  // Attach action button listeners
  attachActionListeners() {
    const mailsList = document.getElementById('importantMailsList');
    if (!mailsList) return;

    mailsList.querySelectorAll('.task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emailRow = e.target.closest('.important-mail-row');
        const emailId = emailRow.dataset.emailId;
        const email = this.importantEmails.find(e => e.id == emailId);
        if (email) this.createTaskFromEmail(email);
      });
    });

    mailsList.querySelectorAll('.calendar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emailRow = e.target.closest('.important-mail-row');
        const emailId = emailRow.dataset.emailId;
        const email = this.importantEmails.find(e => e.id == emailId);
        if (email) this.createCalendarEventFromEmail(email);
      });
    });

    mailsList.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'emails.html';
      });
    });
  }

  // Format email time for display
  formatEmailTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Auto-create tasks and calendar events for important emails
  async autoCreateTasksAndEvents() {
    const token = this.getToken();
    if (!token || this.importantEmails.length === 0) return;

    for (const email of this.importantEmails) {
      // Check if task/event already exists (avoid duplicates)
      const taskExists = await this.checkTaskExists(email.id);
      const eventExists = await this.checkEventExists(email.id);

      // Auto-create task if doesn't exist
      if (!taskExists) {
        await this.autoCreateTask(email);
      }

      // Auto-create calendar event if doesn't exist
      if (!eventExists) {
        await this.autoCreateCalendarEvent(email);
      }
    }
  }

  // Check if task already exists for this email
  async checkTaskExists(emailId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return false;

      const tasks = await response.json();
      return tasks.some(t => t.description && t.description.includes(`Email #${emailId}`));
    } catch (error) {
      return false;
    }
  }

  // Check if calendar event already exists for this email
  async checkEventExists(emailId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_URL}/calendar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return false;

      const events = await response.json();
      return events.some(e => e.description && e.description.includes(`Email #${emailId}`));
    } catch (error) {
      return false;
    }
  }

  // Auto-create task from important email
  async autoCreateTask(email) {
    try {
      const token = this.getToken();
      const preview = email.body ? email.body.substring(0, 100) : 'Important email';

      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `📧 ${email.subject}`,
          description: `From: ${email.from_address}\n\n${preview}\n\nEmail #${email.id}`,
          status: 'pending',
          priority: 'high',
          due_date: this.getNextBusinessDay()
        })
      });

      if (!response.ok) throw new Error('Failed to create task');

      console.log('✅ Auto-created task for:', email.subject);
    } catch (error) {
      console.error('Error auto-creating task:', error);
    }
  }

  // Auto-create calendar event from important email
  async autoCreateCalendarEvent(email) {
    try {
      const token = this.getToken();
      const preview = email.body ? email.body.substring(0, 100) : 'Important email';

      const response = await fetch(`${API_URL}/calendar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `📧 ${email.subject}`,
          description: `From: ${email.from_address}\n\n${preview}\n\nEmail #${email.id}`,
          event_date: this.getNextBusinessDay(),
          event_time: '09:00',
          location: 'Email'
        })
      });

      if (!response.ok) throw new Error('Failed to create calendar event');

      console.log('✅ Auto-created calendar event for:', email.subject);
    } catch (error) {
      console.error('Error auto-creating calendar event:', error);
    }
  }

  // Create task manually from email in dashboard
  async createTaskFromEmail(email) {
    try {
      const dueDate = prompt('Enter due date (YYYY-MM-DD) or leave empty for next business day:', this.getNextBusinessDay());
      
      if (dueDate === null) return; // User cancelled

      const priority = prompt('Enter priority (high/medium/low):', 'high');
      const preview = email.body ? email.body.substring(0, 100) : '';

      const token = this.getToken();
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `📧 ${email.subject}`,
          description: `From: ${email.from_address}\n\n${preview}\n\nEmail #${email.id}`,
          status: 'pending',
          priority: priority || 'high',
          due_date: dueDate || this.getNextBusinessDay()
        })
      });

      if (!response.ok) throw new Error('Failed to create task');

      this.showSuccessMessage('✅ Task created from important email!');
      if (window.dashboardTaskLoader) {
        window.dashboardTaskLoader.loadAndDisplayTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      this.showErrorMessage('Failed to create task');
    }
  }

  // Create calendar event manually from email in dashboard
  async createCalendarEventFromEmail(email) {
    try {
      const eventDate = prompt('Enter event date (YYYY-MM-DD):', this.getNextBusinessDay());
      
      if (eventDate === null) return; // User cancelled

      const eventTime = prompt('Enter time (HH:MM):', '09:00');
      const preview = email.body ? email.body.substring(0, 100) : '';

      const token = this.getToken();
      const response = await fetch(`${API_URL}/calendar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `📧 ${email.subject}`,
          description: `From: ${email.from_address}\n\n${preview}\n\nEmail #${email.id}`,
          event_date: eventDate || this.getNextBusinessDay(),
          event_time: eventTime || '09:00',
          location: 'Email'
        })
      });

      if (!response.ok) throw new Error('Failed to create calendar event');

      this.showSuccessMessage('✅ Calendar event created from important email!');
      if (window.fetchCalendarEvents) {
        window.fetchCalendarEvents();
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      this.showErrorMessage('Failed to create calendar event');
    }
  }

  // Get next business day
  getNextBusinessDay() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    
    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }

    return date.toISOString().split('T')[0];
  }

  // Show success message
  showSuccessMessage(message) {
    if (window.showSuccessAlert) {
      window.showSuccessAlert(message);
    } else {
      alert(message);
    }
  }

  // Show error message
  showErrorMessage(message) {
    if (window.showErrorAlert) {
      window.showErrorAlert(message);
    } else {
      alert(message);
    }
  }

  // Escape HTML
  escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // Get email preview text from body
  getEmailPreview(body, length = 50) {
    if (!body) return 'No preview available';
    const cleanText = body.replace(/<[^>]*>/g, '').trim();
    return cleanText.substring(0, length) + (cleanText.length > length ? '...' : '');
  }

  // Extract sender name from email address
  extractSender(fromAddress) {
    if (!fromAddress) return 'Unknown';
    const match = fromAddress.match(/^([^<@]+)/);
    return match ? match[1].trim() : fromAddress.split('@')[0];
  }
}

// Initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ImportantEmailsManager();
  });
} else {
  new ImportantEmailsManager();
}
