
class TaskManager {
  constructor() {
    this.tasks = [];
    this.apiUrl = 'http://localhost:5000/api/tasks';
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Listen for task completion from home page
    document.addEventListener('taskComplete', (e) => {
      this.completeTask(e.detail.taskId, e.detail.animate);
    });

    document.addEventListener('taskDelete', (e) => {
      this.deleteTask(e.detail.taskId);
    });
  }

  /**
   * Fetch active tasks for dashboard display
   */
  async getActiveTasks() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/active`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      this.tasks = await response.json();
      return this.tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (window.Alert) {
        window.Alert.error('Failed to load tasks', { title: 'Error' });
      }
      return [];
    }
  }

  /**
   * Complete a task with animation
   */
  async completeTask(taskId, animate = true) {
    try {
      const token = localStorage.getItem('token');

      // Animate the task element if it exists
      if (animate) {
        const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskEl) {
          await this.animateTaskCompletion(taskEl);
        }
      }

      // Update in backend
      const response = await fetch(`${this.apiUrl}/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to complete task');

      // Remove from active tasks list
      this.tasks = this.tasks.filter(t => t.id !== taskId);

      if (window.Alert) {
        window.Alert.success('Task completed!', { duration: 3000 });
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing task:', error);
      if (window.Alert) {
        window.Alert.error('Failed to complete task');
      }
    }
  }

  /**
   * Animate task completion
   */
  animateTaskCompletion(taskEl) {
    return new Promise((resolve) => {
      // Add completion class
      taskEl.style.animation = 'slideOutRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      
      setTimeout(() => {
        taskEl.remove();
        resolve();
      }, 500);
    });
  }

  /**
   * Create task from important email
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

      if (window.dashboardTaskLoader) {
        window.dashboardTaskLoader.loadAndDisplayTasks();
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
   * Delete a task
   */
  async deleteTask(taskId) {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${this.apiUrl}/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete task');

      this.tasks = this.tasks.filter(t => t.id !== taskId);

      if (window.Alert) {
        window.Alert.success('Task deleted', { duration: 3000 });
      }

      if (window.dashboardTaskLoader) {
        window.dashboardTaskLoader.loadAndDisplayTasks();
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting task:', error);
      if (window.Alert) {
        window.Alert.error('Failed to delete task');
      }
    }
  }

  /**
   * Render tasks to dashboard
   */
  async renderActiveTasks(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tasks = await this.getActiveTasks();

    if (tasks.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
          <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
          <p>All tasks completed! Great job!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(task => `
      <div class="task-row" data-task-id="${task.id}">
        <div class="task-info">
          <span class="task-name">${task.title}</span>
          <span class="badge ${task.priority}">${task.priority}</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${task.status === 'completed' ? '100' : '50'}%"></div>
        </div>
        <div class="task-meta">
          <span>${task.status}</span>
          <span>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button 
            class="task-action-btn complete" 
            onclick="TaskManager.instance.completeTask(${task.id})"
            title="Mark as done"
          >
            ✓
          </button>
          <button 
            class="task-action-btn delete" 
            onclick="TaskManager.instance.deleteTask(${task.id})"
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>
    `).join('');
  }
}

// Create global instance
TaskManager.instance = new TaskManager();

// Animations for task completion
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  @keyframes checkmark {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }

  .task-action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .task-action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.1);
  }

  .task-action-btn.complete:hover {
    background: rgba(75, 255, 145, 0.2);
    color: #4bff91;
    box-shadow: 0 0 10px rgba(75, 255, 145, 0.3);
  }

  .task-action-btn.delete:hover {
    background: rgba(255, 75, 75, 0.2);
    color: #ff6b6b;
    box-shadow: 0 0 10px rgba(255, 75, 75, 0.3);
  }
`;
document.head.appendChild(style);
