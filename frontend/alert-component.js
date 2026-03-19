/**
 * Modern Alert Component with Animations & Glassmorphism
 * Replaces browser alerts with beautiful, animated components
 */

class AlertComponent {
  constructor() {
    this.alerts = [];
    this.setupStyles();
  }

  setupStyles() {
    // Create and inject CSS if not already present
    if (!document.getElementById('alert-component-styles')) {
      const style = document.createElement('style');
      style.id = 'alert-component-styles';
      style.textContent = `
        @keyframes slideInAlert {
          from {
            opacity: 0;
            transform: translateX(100%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes slideOutAlert {
          from {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%) translateY(-20px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .alert-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
          pointer-events: none;
        }

        .alert-container.mobile {
          left: 10px;
          right: 10px;
          max-width: none;
        }

        .alert {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 16px 20px;
          border-radius: 12px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          animation: slideInAlert 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: all;
          min-width: 300px;
          max-width: 100%;
        }

        .alert.hide {
          animation: slideOutAlert 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Success Alert */
        .alert.success {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(56, 142, 60, 0.1));
          border-color: rgba(76, 175, 80, 0.3);
          color: #4CAF50;
        }

        .alert.success .alert-icon {
          color: #4CAF50;
        }

        /* Error Alert */
        .alert.error {
          background: linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(183, 28, 28, 0.1));
          border-color: rgba(244, 67, 54, 0.3);
          color: #F44336;
        }

        .alert.error .alert-icon {
          color: #F44336;
        }

        /* Warning Alert */
        .alert.warning {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(245, 127, 23, 0.1));
          border-color: rgba(255, 193, 7, 0.3);
          color: #FFC107;
        }

        .alert.warning .alert-icon {
          color: #FFC107;
        }

        /* Info Alert */
        .alert.info {
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(13, 71, 161, 0.1));
          border-color: rgba(33, 150, 243, 0.3);
          color: #2196F3;
        }

        .alert.info .alert-icon {
          color: #2196F3;
        }

        .alert-icon {
          font-size: 20px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .alert-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .alert-title {
          font-weight: 600;
          font-size: 14px;
        }

        .alert-message {
          font-size: 13px;
          opacity: 0.9;
          line-height: 1.4;
        }

        .alert-close {
          flex-shrink: 0;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .alert-close:hover {
          opacity: 1;
        }

        .alert-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: currentColor;
          border-radius: 0 0 12px 0;
          animation: slideOut linear;
        }

        @media (max-width: 640px) {
          .alert-container {
            left: 10px;
            right: 10px;
            max-width: none;
          }

          .alert {
            min-width: auto;
            max-width: 100%;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Show an alert
   * @param {string} message - Main message to display
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {object} options - Additional options
   */
  show(message, type = 'info', options = {}) {
    const {
      title = '',
      duration = 5000,
      closeable = true,
      icon = null,
      onClose = null
    } = options;

    // Get or create container
    let container = document.getElementById('alert-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'alert-container';
      container.className = 'alert-container';
      if (window.innerWidth < 640) {
        container.classList.add('mobile');
      }
      document.body.appendChild(container);
    }

    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `alert ${type}`;
    
    const defaultIcons = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'ℹ'
    };

    const iconContent = icon || defaultIcons[type] || '•';

    alertEl.innerHTML = `
      <div class="alert-icon">${iconContent}</div>
      <div class="alert-content">
        ${title ? `<div class="alert-title">${title}</div>` : ''}
        <div class="alert-message">${message}</div>
      </div>
      ${closeable ? '<button class="alert-close">×</button>' : ''}
    `;

    if (duration > 0) {
      const progress = document.createElement('div');
      progress.className = 'alert-progress';
      progress.style.animation = `slideOut ${duration}ms linear forwards`;
      alertEl.appendChild(progress);
    }

    container.appendChild(alertEl);

    // Close button handler
    const closeBtn = alertEl.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideAlert(alertEl, onClose);
      });
    }

    // Auto-close
    if (duration > 0) {
      setTimeout(() => {
        this.hideAlert(alertEl, onClose);
      }, duration);
    }

    return alertEl;
  }

  hideAlert(alertEl, onClose) {
    alertEl.classList.add('hide');
    setTimeout(() => {
      alertEl.remove();
      if (onClose) onClose();
    }, 300);
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, 'success', {
      title: options.title || 'Success',
      ...options
    });
  }

  error(message, options = {}) {
    return this.show(message, 'error', {
      title: options.title || 'Error',
      duration: options.duration !== undefined ? options.duration : 6000,
      ...options
    });
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', {
      title: options.title || 'Warning',
      ...options
    });
  }

  info(message, options = {}) {
    return this.show(message, 'info', {
      title: options.title || 'Info',
      ...options
    });
  }

  /**
   * Show a confirmation dialog
   */
  confirm(message, title = 'Confirm', options = {}) {
    return new Promise((resolve) => {
      const {
        confirmText = 'Confirm',
        cancelText = 'Cancel'
      } = options;

      const alertEl = document.createElement('div');
      alertEl.className = 'alert info';
      alertEl.style.minWidth = '350px';
      alertEl.innerHTML = `
        <div class="alert-content" style="width: 100%;">
          <div class="alert-title">${title}</div>
          <div class="alert-message">${message}</div>
          <div style="display: flex; gap: 10px; margin-top: 12px;">
            <button id="confirm-yes" style="
              flex: 1;
              padding: 8px 16px;
              background: #2196F3;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              transition: background 0.2s;
            ">${confirmText}</button>
            <button id="confirm-no" style="
              flex: 1;
              padding: 8px 16px;
              background: rgba(255, 255, 255, 0.1);
              color: inherit;
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              transition: background 0.2s;
            ">${cancelText}</button>
          </div>
        </div>
      `;

      let container = document.getElementById('alert-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'alert-container';
        container.className = 'alert-container';
        document.body.appendChild(container);
      }

      container.appendChild(alertEl);

      document.getElementById('confirm-yes').addEventListener('click', () => {
        alertEl.classList.add('hide');
        setTimeout(() => {
          alertEl.remove();
          resolve(true);
        }, 300);
      });

      document.getElementById('confirm-no').addEventListener('click', () => {
        alertEl.classList.add('hide');
        setTimeout(() => {
          alertEl.remove();
          resolve(false);
        }, 300);
      });
    });
  }
}

// Global instance
window.Alert = new AlertComponent();

// Override console methods for development
if (window.location.hostname === 'localhost') {
  const originalLog = console.log;
  // Uncomment below to see logs as alerts during development
  // console.log = function(...args) {
  //   originalLog.apply(console, args);
  //   Alert.info(args.map(a => String(a)).join(' '));
  // };
}
