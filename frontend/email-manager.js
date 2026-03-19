/**
 * Email Management Module
 * Handles email operations, categorization, and important email display
 */

class EmailManager {
  constructor() {
    this.emails = [];
    this.apiUrl = 'http://localhost:5000/api/emails';
    this.accountsApiUrl = 'http://localhost:5000/api/email-accounts';
  }

  /**
   * Get all emails with optional filtering
   */
  async getEmails(filter = 'important', category = null) {
    try {
      const token = localStorage.getItem('token');
      let url = `${this.apiUrl}?filter=${filter}`;
      
      if (category) {
        url += `&category=${category}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch emails');

      this.emails = await response.json();
      return this.emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      if (window.Alert) {
        window.Alert.error('Failed to load emails', { title: 'Error' });
      }
      return [];
    }
  }

  /**
   * Get important emails for dashboard
   */
  async getImportantEmails(limit = 5) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${this.apiUrl}/important`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch important emails');

      const emails = await response.json();
      return emails.slice(0, limit);
    } catch (error) {
      console.error('Error fetching important emails:', error);
      return [];
    }
  }

  /**
   * Get emails by category
   */
  async getEmailsByCategory(category) {
    return this.getEmails('all', category);
  }

  /**
   * Mark email as important
   */
  async markAsImportant(emailId, isImportant = true) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${this.apiUrl}/${emailId}/important`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_important: isImportant })
      });

      if (!response.ok) throw new Error('Failed to update email');

      if (window.Alert) {
        const message = isImportant ? 'Marked as important' : 'Removed from important';
        window.Alert.success(message, { duration: 3000 });
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating email:', error);
      if (window.Alert) {
        window.Alert.error('Failed to update email');
      }
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(emailId) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${this.apiUrl}/${emailId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      return await response.json();
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }

  /**
   * Archive email
   */
  async archiveEmail(emailId) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${this.apiUrl}/${emailId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to archive email');

      if (window.Alert) {
        window.Alert.success('Email archived', { duration: 3000 });
      }

      return await response.json();
    } catch (error) {
      console.error('Error archiving email:', error);
      if (window.Alert) {
        window.Alert.error('Failed to archive email');
      }
    }
  }

  /**
   * Get email accounts
   */
  async getEmailAccounts() {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(this.accountsApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch email accounts');

      return await response.json();
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      return [];
    }
  }

  /**
   * Sync emails from account
   */
  async syncEmails(accountId) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${this.accountsApiUrl}/${accountId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to sync emails');

      if (window.Alert) {
        window.Alert.success('Emails synced successfully', { 
          title: 'Sync Complete',
          duration: 4000 
        });
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing emails:', error);
      if (window.Alert) {
        window.Alert.error('Failed to sync emails');
      }
    }
  }

  /**
   * Connect new email account
   */
  async connectEmailAccount(email, provider, accessToken, refreshToken) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(this.accountsApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          provider,
          access_token: accessToken,
          refresh_token: refreshToken
        })
      });

      if (!response.ok) throw new Error('Failed to connect email account');

      if (window.Alert) {
        window.Alert.success(`${email} connected successfully`, { 
          title: 'Account Connected',
          duration: 4000 
        });
      }

      return await response.json();
    } catch (error) {
      console.error('Error connecting email account:', error);
      if (window.Alert) {
        window.Alert.error('Failed to connect email account');
      }
    }
  }

  /**
   * Disconnect email account
   */
  async disconnectEmailAccount(accountId) {
    try {
      const token = localStorage.getItem('token');

      const confirmed = await window.Alert?.confirm(
        'Are you sure you want to disconnect this email account? Associated emails will be deleted.',
        'Disconnect Account',
        { confirmText: 'Disconnect', cancelText: 'Cancel' }
      );

      if (!confirmed) return;

      const response = await fetch(`${this.accountsApiUrl}/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to disconnect account');

      if (window.Alert) {
        window.Alert.success('Email account disconnected', { duration: 3000 });
      }

      return await response.json();
    } catch (error) {
      console.error('Error disconnecting email account:', error);
      if (window.Alert) {
        window.Alert.error('Failed to disconnect account');
      }
    }
  }

  /**
   * Render important emails to dashboard
   */
  async renderImportantEmails(containerId, limit = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="spinner"></div>';

    const emails = await this.getImportantEmails(limit);

    if (emails.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
          <div style="font-size: 48px; margin-bottom: 16px;">📬</div>
          <p>No important emails</p>
        </div>
      `;
      return;
    }

    // Helper to sanitize content
    const sanitize = (str) => {
      if (window.DOMPurify) return window.DOMPurify.sanitize(str || '');
      return String(str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
      })[m]);
    };

    // Helper to strip tags for preview
    const stripTags = (str) => {
      if (window.DOMPurify) return window.DOMPurify.sanitize(str || '', { ALLOWED_TAGS: [] });
      return String(str || '').replace(/<[^>]*>/g, '');
    };

    container.innerHTML = emails.map(email => `
      <div class="email-item" data-email-id="${email.id}">
        <div class="email-from">${sanitize(email.from_address)}</div>
        <div class="email-subject">${sanitize(email.subject)}</div>
        <div class="email-preview">${stripTags(email.body).substring(0, 100)}...</div>
        <div class="email-actions">
          <button 
            class="email-action-btn task" 
            onclick="EmailManager.instance.createTaskFromEmail(${email.id}, '${(email.subject || '').replace(/'/g, "\\'")}')"
            title="Create task from email"
          >
            📝 Create Task
          </button>
          <button 
            class="email-action-btn archive" 
            onclick="EmailManager.instance.archiveEmail(${email.id})"
            title="Archive email"
          >
            📋 Archive
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Create task from email
   */
  async createTaskFromEmail(emailId, emailSubject) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/emails/${emailId}/create-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: emailSubject,
          priority: 'high'
        })
      });

      if (!response.ok) throw new Error('Failed to create task');

      if (window.Alert) {
        window.Alert.success('Task created from email!', { 
          title: 'Task Created',
          duration: 4000 
        });
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating task from email:', error);
      if (window.Alert) {
        window.Alert.error('Failed to create task from email');
      }
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats() {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${this.accountsApiUrl}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      return await response.json();
    } catch (error) {
      console.error('Error fetching email stats:', error);
      return null;
    }
  }
}

// Create global instance
EmailManager.instance = new EmailManager();

// Email styles
const style = document.createElement('style');
style.textContent = `
  .email-item {
    padding: 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    margin-bottom: 8px;
    transition: all 0.3s;
  }

  .email-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--accent);
    transform: translateX(4px);
  }

  .email-from {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 4px;
  }

  .email-subject {
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
    font-size: 14px;
  }

  .email-preview {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .email-actions {
    display: flex;
    gap: 6px;
  }

  .email-action-btn {
    flex: 1;
    padding: 6px 10px;
    background: rgba(63, 220, 255, 0.1);
    border: 1px solid rgba(63, 220, 255, 0.2);
    border-radius: 6px;
    color: var(--accent);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.3s;
  }

  .email-action-btn:hover {
    background: rgba(63, 220, 255, 0.2);
    box-shadow: 0 0 10px rgba(63, 220, 255, 0.2);
  }
`;
document.head.appendChild(style);
