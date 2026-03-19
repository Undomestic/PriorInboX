/**
 * Email AI Analyzer - Intelligent email importance detection
 * Analyzes and marks important emails automatically using AI scoring
 */

class EmailAIAnalyzer {
  constructor(containerSelector = '.dashboard') {
    this.container = document.querySelector(containerSelector);
    this.isAnalyzing = false;
    this.analysisResults = null;
    // Use global config if available, otherwise fallback
    this.API_URL = window.APP_CONFIG?.API_URL || 'http://localhost:5000/api';
    this.initUI();
  }

  initUI() {
    // Check if static HTML already exists (from priorInboX-home.html)
    if (document.getElementById('emailAISection')) {
      this.attachEventListeners();
      return;
    }

    this.injectStyles();
    // Create analysis control panel
    this.createAnalysisPanel();
    this.attachEventListeners();
  }

  createAnalysisPanel() {
    const panel = document.createElement('div');
    panel.className = 'email-ai-panel';
    panel.innerHTML = `
      <div class="ai-panel-header">
        <h4>🧠 Email Intelligence</h4>
        <button class="ai-analyze-btn" id="aiAnalyzeBtn" title="Analyze and mark important emails">
          <span class="ai-icon">⚡</span>
          Analyze Emails
        </button>
      </div>
      
      <div class="ai-status" id="aiStatus" style="display: none;">
        <div class="ai-spinner"></div>
        <p>Analyzing emails...</p>
      </div>

      <div class="ai-results" id="aiResults" style="display: none;">
        <div class="ai-summary">
          <div class="ai-stat">
            <span class="ai-stat-label">Analyzed</span>
            <span class="ai-stat-value" id="analyzedCount">0</span>
          </div>
          <div class="ai-stat">
            <span class="ai-stat-label">Marked Important</span>
            <span class="ai-stat-value" id="markedCount">0</span>
          </div>
          <div class="ai-stat">
            <span class="ai-stat-label">Success Rate</span>
            <span class="ai-stat-value" id="successRate">0%</span>
          </div>
        </div>

        <div class="ai-details">
          <h5>📊 Insights</h5>
          <button class="toggle-btn" id="toggleInsights">Show Insights</button>
          <div class="ai-insights" id="aiInsights" style="display: none;"></div>
        </div>

        <div class="ai-suggestions">
          <h5>💡 Suggestions</h5>
          <button class="toggle-btn" id="toggleSuggestions">Show Suggestions</button>
          <div class="ai-suggestions-content" id="aiSuggestionsContent" style="display: none;"></div>
        </div>

        <button class="ai-close-btn" id="aiCloseBtn">✕ Close</button>
      </div>
    `;

    // Insert after important emails section
    const importantEmailsSection = document.querySelector('.important-emails-section');
    if (importantEmailsSection && importantEmailsSection.parentNode) {
      importantEmailsSection.parentNode.insertBefore(panel, importantEmailsSection.nextSibling);
    }

    this.panel = panel;
  }

  attachEventListeners() {
    const analyzeBtn = document.getElementById('aiAnalyzeBtn');
    const closeBtn = document.getElementById('aiCloseBtn');
    const toggleInsights = document.getElementById('toggleInsights');
    const toggleSuggestions = document.getElementById('toggleSuggestions');

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeEmails());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeResults());
    }
    if (toggleInsights) {
      toggleInsights.addEventListener('click', (e) => {
        const insights = document.getElementById('aiInsights');
        const isVisible = insights.style.display !== 'none';
        insights.style.display = isVisible ? 'none' : 'block';
        e.target.textContent = isVisible ? 'Show Insights' : 'Hide Insights';
      });
    }
    if (toggleSuggestions) {
      toggleSuggestions.addEventListener('click', (e) => {
        const suggestions = document.getElementById('aiSuggestionsContent');
        const isVisible = suggestions.style.display !== 'none';
        suggestions.style.display = isVisible ? 'none' : 'block';
        e.target.textContent = isVisible ? 'Show Suggestions' : 'Hide Suggestions';
      });
    }
  }

  async analyzeEmails() {
    if (this.isAnalyzing) return;

    try {
      this.isAnalyzing = true;
      const statusEl = document.getElementById('aiStatus');
      const resultsEl = document.getElementById('aiResults');
      const analyzeBtn = document.getElementById('aiAnalyzeBtn') || document.getElementById('analyzeEmailsBtn');
      const spinner = statusEl.querySelector('.spinner') || statusEl.querySelector('.ai-spinner');
      const statusText = statusEl.querySelector('p');

      // Show loading status
      statusEl.style.display = 'block';
      if (spinner) spinner.style.display = 'block';
      if (statusText) {
        statusText.textContent = 'Analyzing emails...';
        statusText.style.color = '';
      }
      
      resultsEl.style.display = 'none';
      if (analyzeBtn) analyzeBtn.disabled = true;

      // Fetch analysis results
      const token = localStorage.getItem('token');
      let analysisData = null;
      const maxRetries = 3;

      if (!token) throw new Error('Please login to analyze emails');

      for (let i = 0; i < maxRetries; i++) {
        try {
          if (i > 0) {
            if (statusText) statusText.textContent = `Retrying analysis (${i + 1}/${maxRetries})...`;
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          const response = await fetch(`${this.API_URL}/ai/analyze-emails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) throw new Error(response.statusText);
            throw new Error(`Analysis failed: ${response.statusText}`);
          }

          analysisData = await response.json();
          if (statusText) statusText.textContent = 'Analyzing emails...';
          break;
        } catch (err) {
          if (i === maxRetries - 1) throw err;
          console.warn(`Attempt ${i + 1} failed:`, err);
        }
      }

      // Fetch insights and suggestions in parallel for better performance
      const [insightsResponse, suggestionsResponse] = await Promise.all([
        fetch(`${this.API_URL}/ai/email-insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${this.API_URL}/ai/email-suggestions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ]);

      const insightsData = insightsResponse.ok ? await insightsResponse.json() : null;
      const suggestionsData = suggestionsResponse.ok ? await suggestionsResponse.json() : null;

      // Display results
      this.displayAnalysisResults(analysisData, insightsData, suggestionsData);

      // Hide loading, show results
      statusEl.style.display = 'none';
      resultsEl.style.display = 'block';
      resultsEl.classList.add('fade-in-up');
      if (analyzeBtn) analyzeBtn.disabled = false;

    } catch (error) {
      console.error('Email analysis error:', error);
      
      // Improved UI error handling
      const statusEl = document.getElementById('aiStatus');
      const spinner = statusEl.querySelector('.spinner') || statusEl.querySelector('.ai-spinner');
      const statusText = statusEl.querySelector('p');
      
      if (spinner) spinner.style.display = 'none';
      if (statusText) {
        statusText.textContent = `❌ ${error.message}`;
        statusText.style.color = 'var(--status-danger, #ef4444)';
      }
      
      const analyzeBtn = document.getElementById('aiAnalyzeBtn') || document.getElementById('analyzeEmailsBtn');
      if (analyzeBtn) analyzeBtn.disabled = false;
      this.isAnalyzing = false;
    }

    this.isAnalyzing = false;
  }

  displayAnalysisResults(analysisData, insightsData, suggestionsData) {
    const analyzedCount = analysisData.analyzed || 0;
    const markedCount = analysisData.marked || 0;
    const successRate = analyzedCount > 0 ? Math.round((markedCount / analyzedCount) * 100) : 0;

    // Update summary
    document.getElementById('analyzedCount').textContent = analyzedCount;
    document.getElementById('markedCount').textContent = markedCount;
    document.getElementById('successRate').textContent = successRate + '%';

    // Display insights
    if (insightsData && insightsData.success) {
      this.displayInsights(insightsData.statistics);
    }

    // Display suggestions
    if (suggestionsData && suggestionsData.success) {
      this.displaySuggestions(suggestionsData.suggestions);
    }
  }

  displayInsights(statistics) {
    const insightsContainer = document.getElementById('aiInsights');
    
    let html = '<div class="insights-grid">';
    
    // Total emails insight with visual cards
    if (statistics) {
      const importanceRate = statistics.importance_rate || 0;
      html += `
        <div class="insight-card">
          <div class="insight-icon">📨</div>
          <div class="insight-data">
            <span class="insight-value">${statistics.total_emails || 0}</span>
            <span class="insight-label">Total Emails</span>
          </div>
        </div>
        <div class="insight-card">
          <div class="insight-icon">⭐</div>
          <div class="insight-data">
            <span class="insight-value">${statistics.important_count || 0}</span>
            <span class="insight-label">Important</span>
          </div>
        </div>
        <div class="insight-card full-width">
          <div class="insight-header">
            <span class="insight-label">Importance Rate</span>
            <span class="insight-value">${importanceRate}%</span>
          </div>
          <div class="insight-progress-track">
            <div class="insight-progress-fill" style="width: ${importanceRate}%"></div>
          </div>
        </div>
      `;
    }

    html += '</div>'; // Close top grid

    // Two column layout for lists
    html += '<div class="insights-lists-container">';

    // Top senders
    if (statistics && statistics.top_senders && statistics.top_senders.length > 0) {
      html += '<div class="insight-section"><h6>🏆 Top Senders</h6><div class="sender-list">';
      statistics.top_senders.slice(0, 5).forEach(sender => {
        const name = this.escapeHtml(sender.from_name || sender.from_email);
        const initial = name.charAt(0).toUpperCase();
        html += `
          <div class="sender-item">
            <div class="sender-avatar">${initial}</div>
            <div class="sender-info">
              <span class="sender-name">${name}</span>
              <div class="sender-bar-container">
                <div class="sender-bar" style="width: ${sender.importance_percentage || 0}%"></div>
              </div>
            </div>
            <span class="sender-percent">${sender.importance_percentage || 0}%</span>
          </div>
        `;
      });
      html += '</div></div>';
    }

    // Category breakdown
    if (statistics && statistics.by_category) {
      html += '<div class="insight-section"><h6>🏷️ Categories</h6><div class="category-list">';
      Object.entries(statistics.by_category).forEach(([category, count]) => {
        html += `
          <div class="category-item">
            <span class="category-name">${this.capitalizeFirst(category)}</span>
            <span class="category-badge">${count || 0}</span>
          </div>
        `;
      });
      html += '</div></div>';
    }

    html += '</div>'; // Close lists container
    insightsContainer.innerHTML = html;
  }

  displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('aiSuggestionsContent');
    
    let html = '<div class="suggestions-list">';

    if (suggestions && suggestions.length > 0) {
      suggestions.forEach((suggestion, idx) => {
        // Determine icon based on title keywords
        let icon = '💡';
        const titleLower = suggestion.title.toLowerCase();
        if (titleLower.includes('urgent') || titleLower.includes('deadline')) icon = '⏰';
        else if (titleLower.includes('meeting') || titleLower.includes('calendar')) icon = '📅';
        else if (titleLower.includes('organize') || titleLower.includes('clean')) icon = '🧹';
        else if (titleLower.includes('security') || titleLower.includes('spam')) icon = '🛡️';

        html += `
          <div class="suggestion-card">
            <div class="suggestion-header">
              <span class="suggestion-icon">${icon}</span>
              <h6>${this.escapeHtml(suggestion.title)}</h6>
            </div>
            <p class="suggestion-desc">${this.escapeHtml(suggestion.description)}</p>
        `;

        if (suggestion.items && suggestion.items.length > 0) {
          html += '<ul class="suggestion-items">';
          suggestion.items.slice(0, 5).forEach(item => {
            html += `<li>${this.escapeHtml(item)}</li>`;
          });
          html += '</ul>';
        }

        html += '</div>';
      });
    } else {
      html += `
        <div class="no-suggestions" style="text-align: center; padding: 20px; color: var(--muted);">
          <span style="font-size: 24px;">✨</span>
          <p>Your inbox is looking great! No new suggestions.</p>
        </div>`;
    }

    html += '</div>';
    suggestionsContainer.innerHTML = html;
  }

  closeResults() {
    const resultsEl = document.getElementById('aiResults');
    resultsEl.style.display = 'none';
    resultsEl.classList.remove('fade-in-up');
    document.getElementById('aiStatus').style.display = 'none';
    document.getElementById('aiAnalyzeBtn').disabled = false;
  }

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

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  injectStyles() {
    if (document.getElementById('email-ai-styles')) return;
    const style = document.createElement('style');
    style.id = 'email-ai-styles';
    style.textContent = `
      .email-ai-panel {
        background: var(--card, rgba(255, 255, 255, 0.06));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
        border-radius: 18px;
        padding: 32px;
        margin: 24px 0;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        color: var(--text, #fff);
        transition: all 0.3s ease;
        animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
      }

      .email-ai-panel:hover {
        border-color: rgba(63, 220, 255, 0.3);
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px var(--accent-glow, rgba(63, 220, 255, 0.4));
        transform: translateY(-5px);
      }

      .ai-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      }

      .ai-panel-header h4 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--accent, #3fdcff);
      }

      .ai-analyze-btn {
        background: linear-gradient(135deg, var(--accent, #3fdcff) 0%, rgba(56, 189, 248, 0.8) 100%);
        color: #050b18;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        font-size: 1rem;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 15px var(--accent-glow, rgba(63, 220, 255, 0.4));
      }

      .ai-analyze-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.1);
        box-shadow: 0 6px 20px var(--accent-glow, rgba(63, 220, 255, 0.6));
      }

      .ai-analyze-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        filter: grayscale(1);
      }

      .ai-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .ai-stat {
        background: rgba(255, 255, 255, 0.03);
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
        transition: transform 0.2s;
      }

      .ai-stat:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.06);
        border-color: var(--accent, #3fdcff);
      }

      .ai-stat-label {
        display: block;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--muted, #cfd9ff);
        margin-bottom: 10px;
      }

      .ai-stat-value {
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--text, #fff);
      }

      .ai-details, .ai-suggestions {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      }

      .toggle-btn {
        background: transparent;
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
        color: var(--muted, #cfd9ff);
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
      }

      .toggle-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--accent, #3fdcff);
        border-color: var(--accent, #3fdcff);
      }

      /* Improved Insights Styling */
      .insights-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .insight-card {
        background: rgba(255, 255, 255, 0.05);
        padding: 15px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      }
      
      .insight-card.full-width {
        grid-column: span 2;
        display: block;
      }

      .insight-icon {
        font-size: 24px;
        background: rgba(255, 255, 255, 0.1);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
      }

      .insight-data {
        display: flex;
        flex-direction: column;
      }

      .insight-value {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text, #fff);
      }

      .insight-label {
        font-size: 0.8rem;
        color: var(--muted, #cfd9ff);
      }

      .insight-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .insight-progress-track {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }

      .insight-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent, #3fdcff), #818cf8);
        border-radius: 3px;
      }

      .insights-lists-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      @media (max-width: 600px) {
        .insights-lists-container {
          grid-template-columns: 1fr;
        }
      }

      .insight-section h6 {
        margin: 0 0 12px 0;
        font-size: 0.9rem;
        color: var(--text, #fff);
        opacity: 0.9;
        border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
        padding-bottom: 8px;
      }

      .sender-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
      }

      .sender-avatar {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--accent, #3fdcff), #6366f1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #fff;
        font-size: 12px;
      }

      .sender-info {
        flex: 1;
        overflow: hidden;
      }

      .sender-name {
        display: block;
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .sender-bar-container {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        width: 100%;
      }

      .sender-bar {
        height: 100%;
        background: var(--accent, #3fdcff);
        border-radius: 2px;
      }

      .sender-percent {
        font-size: 0.75rem;
        color: var(--muted, #cfd9ff);
        min-width: 30px;
        text-align: right;
      }

      .category-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 6px;
        margin-bottom: 6px;
        border: 1px solid transparent;
        transition: border-color 0.2s;
      }
      
      .category-item:hover {
        border-color: var(--accent, #3fdcff);
      }

      .category-badge {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.75rem;
        color: var(--text, #fff);
      }

      /* Improved Suggestions Styling */
      .suggestion-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        transition: transform 0.2s;
      }

      .suggestion-card:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.05);
        border-color: var(--accent, #3fdcff);
      }

      .suggestion-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .suggestion-icon {
        font-size: 20px;
      }

      .suggestion-card h6 {
        margin: 0;
        font-size: 1rem;
        color: var(--accent, #3fdcff);
      }

      .suggestion-desc {
        font-size: 0.85rem;
        color: var(--muted, #cfd9ff);
        margin: 0 0 12px 0;
        line-height: 1.4;
      }

      .suggestion-items {
        margin: 0;
        padding-left: 20px;
        font-size: 0.85rem;
        color: var(--text, #fff);
      }

      .ai-close-btn {
        width: 100%;
        margin-top: 20px;
        padding: 12px;
        background: transparent;
        border: 1px dashed var(--glass-border, rgba(255, 255, 255, 0.1));
        color: var(--muted, #cfd9ff);
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s;
      }

      .ai-close-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text, #fff);
        border-color: var(--accent, #3fdcff);
      }

      .ai-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        border-top-color: var(--accent, #3fdcff);
        animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        margin: 0 auto 16px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .fade-in-up {
        animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      /* Light theme adjustments for AI panel */
      body.light .email-ai-panel {
        background: var(--card, rgba(255, 255, 255, 0.8));
        border-color: var(--border-color, #e2e8f0);
        color: var(--text, #020617);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      }

      body.light .ai-panel-header h4 {
        color: var(--accent, #0891b2);
      }

      body.light .ai-results {
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid var(--border-color, #e2e8f0);
        color: var(--text, #020617);
      }

      body.light .ai-stat {
        background: #ffffff;
        border-color: var(--border-color, #e2e8f0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      }

      body.light .ai-stat-label {
        color: var(--muted, #64748b);
      }

      body.light .ai-stat-value {
        color: var(--accent, #0891b2);
      }

      body.light .ai-status {
        background: rgba(0, 0, 0, 0.03);
        color: var(--text, #020617);
      }

      body.light .ai-spinner {
        border-color: rgba(0, 0, 0, 0.1);
        border-top-color: var(--accent, #0891b2);
      }

      body.light .insight-card,
      body.light .sender-item,
      body.light .category-item,
      body.light .suggestion-card {
        background: #ffffff;
        border: 1px solid var(--border-color, #e2e8f0);
        color: var(--text, #020617);
      }
      
      body.light .insight-value,
      body.light .sender-name,
      body.light .category-name {
        color: var(--text, #020617);
      }
      
      body.light .insight-icon {
        background: rgba(0, 0, 0, 0.05);
      }
      
      body.light .insight-progress-track,
      body.light .sender-bar-container,
      body.light .category-badge {
        background: rgba(0, 0, 0, 0.05);
        color: var(--text, #020617);
      }

      body.light .toggle-btn,
      body.light .ai-close-btn {
        background: #ffffff;
        border-color: var(--border-color, #e2e8f0);
        color: var(--text, #020617);
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.emailAIAnalyzer = new EmailAIAnalyzer();
  });
} else {
  window.emailAIAnalyzer = new EmailAIAnalyzer();
}
