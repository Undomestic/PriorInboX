/**
 * Timezone Manager
 * Handles user timezone detection, storage, and conversion
 */

class TimezoneManager {
  constructor() {
    this.userTimezone = 'UTC';
    this.init();
  }

  async init() {
    // Detect user's timezone on page load
    this.detectTimezone();
    
    // Load saved timezone from server
    await this.loadSavedTimezone();
  }

  /**
   * Detect user's timezone using browser's Intl API
   */
  detectTimezone() {
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`🌍 Detected timezone: ${detectedTz}`);
    this.userTimezone = detectedTz || 'UTC';
    localStorage.setItem('detectedTimezone', detectedTz);
  }

  /**
   * Load user's saved timezone from server
   */
  async loadSavedTimezone() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/auth/timezone', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const savedTz = data.timezone;
      
      if (savedTz && savedTz !== 'UTC') {
        this.userTimezone = savedTz;
        console.log(`📌 Loaded saved timezone: ${savedTz}`);
      } else {
        // First time login - save detected timezone
        await this.saveTimezone();
      }
    } catch (error) {
      console.error('❌ Error loading timezone:', error);
    }
  }

  /**
   * Save user's timezone to server
   */
  async saveTimezone() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/auth/timezone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timezone: this.userTimezone })
      });

      if (!response.ok) {
        console.error('❌ Failed to save timezone');
        return;
      }

      console.log(`✅ Timezone saved: ${this.userTimezone}`);
    } catch (error) {
      console.error('❌ Error saving timezone:', error);
    }
  }

  /**
   * Convert UTC date to user's local timezone
   * @param {Date|string} utcDate - UTC date to convert
   * @returns {string} - Formatted date in user's timezone
   */
  formatToUserTimezone(utcDate, options = {}) {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: this.userTimezone
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const formatter = new Intl.DateTimeFormat('en-US', mergedOptions);
      return formatter.format(date);
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return date.toString();
    }
  }

  /**
   * Get date only in user's timezone
   * @param {Date|string} utcDate - UTC date
   * @returns {string} - YYYY-MM-DD format
   */
  formatDateOnly(utcDate) {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    return formatter.format(date);
  }

  /**
   * Get time only in user's timezone
   * @param {Date|string} utcDate - UTC date
   * @returns {string} - HH:MM format
   */
  formatTimeOnly(utcDate) {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return formatter.format(date);
  }

  /**
   * Get list of all available timezones
   */
  getAvailableTimezones() {
    return [
      // Americas
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'America/Toronto',
      'America/Mexico_City',
      'America/Buenos_Aires',
      'America/Sao_Paulo',
      
      // Europe
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Moscow',
      'Europe/Istanbul',
      
      // Asia
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Bangkok',
      'Asia/Shanghai',
      'Asia/Hong_Kong',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Singapore',
      
      // Australia
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane',
      'Australia/Perth',
      'Australia/Adelaide',
      
      // Africa
      'Africa/Cairo',
      'Africa/Johannesburg',
      'Africa/Lagos',
      
      // Pacific
      'Pacific/Auckland',
      'Pacific/Fiji',
      
      // UTC
      'UTC'
    ];
  }

  /**
   * Set user's timezone manually
   * @param {string} timezone - Timezone ID (e.g., 'America/New_York')
   */
  async setTimezone(timezone) {
    this.userTimezone = timezone;
    localStorage.setItem('userTimezone', timezone);
    await this.saveTimezone();
    console.log(`✅ Timezone changed to: ${timezone}`);
  }

  /**
   * Get current user timezone
   */
  getTimezone() {
    return this.userTimezone;
  }
}

// Initialize on page load
const timezoneManager = new TimezoneManager();

// Expose globally
window.timezoneManager = timezoneManager;
