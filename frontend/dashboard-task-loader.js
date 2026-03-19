/**
 * Dashboard Task Overview Loader
 * Fetches and displays tasks on the home page dashboard
 */

class DashboardTaskLoader {
  constructor() {
    this.apiUrl = 'http://localhost:5000/api/tasks';
    this.tasks = [];
    this.init();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.loadAndDisplayTasks());
    } else {
      this.loadAndDisplayTasks();
    }
  }

  /**
   * Fetch tasks from API and display them
   */
  async loadAndDisplayTasks() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      // Fetch all tasks
      const response = await fetch(`${this.apiUrl}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      this.tasks = await response.json();
      
      // Display tasks in dashboard
      this.displayTasksOverview();
      
      // Update priority graph
      this.updatePriorityGraph();
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Show empty state gracefully
      this.displayEmptyState();
    }
  }

  /**
   * Display tasks in the Tasks Overview section
   */
  displayTasksOverview() {
    const taskList = document.querySelector('.task-list');
    
    if (!taskList) {
      console.warn('Task list container not found');
      return;
    }

    // Filter and sort tasks
    const activeTasks = this.tasks
      .filter(task => task.status !== 'completed')
      .sort((a, b) => {
        // Sort by priority: high > medium > low
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority] || 4;
        const bPriority = priorityOrder[b.priority] || 4;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then sort by due date
        const aDate = new Date(a.due_date || '2099-12-31');
        const bDate = new Date(b.due_date || '2099-12-31');
        return aDate - bDate;
      })
      .slice(0, 3); // Show top 3 tasks

    if (activeTasks.length === 0) {
      taskList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--muted);">
          <p>No active tasks</p>
          <p style="font-size: 12px; margin-top: 10px;">Go to Tasks to create one</p>
        </div>
      `;
      return;
    }

    // Generate HTML for tasks
    taskList.innerHTML = activeTasks.map(task => {
      const progress = task.status === 'completed' ? 100 : (task.progress || 0);
      const statusText = this.getStatusText(task.status);
      const dueText = this.getDueText(task.due_date);
      const badgeClass = (task.priority || 'medium').toLowerCase();

      return `
        <div class="task-row" data-task-id="${task.id}">
          <div class="task-info">
            <span class="task-name">${this.escapeHtml(task.title)}</span>
            <span class="badge ${badgeClass}">${this.capitalizeFirst(badgeClass)}</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="task-meta">
            <span>${statusText}</span>
            <span>${dueText}</span>
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
            <button 
              class="task-action-btn complete" 
              onclick="TaskManager.instance.completeTask(${task.id}).then(() => window.dashboardTaskLoader.refreshAfterCompletion(${task.id}))"
              title="Mark as done"
              style="width: auto; padding: 4px 12px; gap: 6px; display: inline-flex; font-size: 12px;"
            >
              <span>✓</span> Done
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update the priority distribution graph
   */
  updatePriorityGraph() {
    // Count tasks by priority
    const priorityCounts = {
      high: 0,
      medium: 0,
      low: 0
    };

    this.tasks.forEach(task => {
      if (task.status !== 'completed') {
        const priority = task.priority || 'medium';
        if (priorityCounts.hasOwnProperty(priority)) {
          priorityCounts[priority]++;
        }
      }
    });

    const total = priorityCounts.high + priorityCounts.medium + priorityCounts.low;
    const max = Math.max(...Object.values(priorityCounts), 1); // Avoid division by zero

    // Update graph bars
    const highBar = document.querySelector('.graph-bar.high');
    const mediumBar = document.querySelector('.graph-bar.medium');
    const lowBar = document.querySelector('.graph-bar.low');

    if (highBar) {
      const heightPercent = total > 0 ? (priorityCounts.high / max) * 100 : 0;
      highBar.style.height = `${heightPercent}%`;
    }

    if (mediumBar) {
      const heightPercent = total > 0 ? (priorityCounts.medium / max) * 100 : 0;
      mediumBar.style.height = `${heightPercent}%`;
    }

    if (lowBar) {
      const heightPercent = total > 0 ? (priorityCounts.low / max) * 100 : 0;
      lowBar.style.height = `${heightPercent}%`;
    }
  }

  /**
   * Refresh dashboard after task completion
   */
  refreshAfterCompletion(taskId) {
    // Remove from local list to keep graph accurate
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    
    // Update graph immediately
    this.updatePriorityGraph();
    
    // If no active tasks left, show empty state
    const activeTasks = this.tasks.filter(t => t.status !== 'completed');
    if (activeTasks.length === 0) {
      this.displayTasksOverview();
    }
  }

  /**
   * Get status text from status value
   */
  getStatusText(status) {
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'started': 'Started',
      'completed': 'Completed'
    };
    return statusMap[status] || this.capitalizeFirst(status);
  }

  /**
   * Get due date text
   */
  getDueText(dueDate) {
    if (!dueDate) return 'No due date';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    if (diffDays === -1) return 'Overdue';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays <= 7) return `Due in ${diffDays} days`;

    return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  /**
   * Display empty state
   */
  displayEmptyState() {
    const taskList = document.querySelector('.task-list');
    
    if (taskList) {
      taskList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--muted);">
          <p>Unable to load tasks</p>
          <p style="font-size: 12px; margin-top: 10px;">Please refresh the page</p>
        </div>
      `;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
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

  /**
   * Capitalize first letter
   */
  capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.dashboardTaskLoader = new DashboardTaskLoader();
  });
} else {
  window.dashboardTaskLoader = new DashboardTaskLoader();
}
