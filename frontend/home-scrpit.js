// Calendar Events Data
let calendarEvents = {};

// Initialize Mini Calendar
const miniCalendarDiv = document.getElementById('miniCalendar');
function initMiniCalendar() {
  if (!miniCalendarDiv) {
    console.error("Error: #miniCalendar element not found in the DOM. Mini calendar cannot be initialized.");
    return; // Stop execution if the element isn't found
  }
  // Clear previous content to prevent issues if called multiple times,
  // but only after the initial diagnostic check.
  miniCalendarDiv.innerHTML = '';

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let html = `<div class="mini-calendar-header">${today.toLocaleString('default', { month: 'short', year: 'numeric' })}</div>`;
  html += '<div class="mini-calendar-weekdays"><div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div></div>';
  html += '<div class="mini-calendar-dates">';
  
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate();
    // Ensure consistent date formatting: YYYY-MM-DD
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasEvent = calendarEvents[dateString] && calendarEvents[dateString].length > 0;
    
    let cellClasses = ['date-cell'];
    // Check if this is today - compare year, month, and day independently to avoid timezone issues
    const isTodayDate = year === today.getFullYear() && 
                        month === today.getMonth() && 
                        isToday;
    
    if (isTodayDate) cellClasses.push('today');
    if (hasEvent) cellClasses.push('has-event');

    html += `<div class="${cellClasses.join(' ')}" data-full-date="${dateString}">${day}`;
    if (hasEvent) {
      html += `<span class="event-dot"></span>`; // Add event dot
    }
    html += `</div>`;
  }
  
  html += '</div>';
  miniCalendarDiv.innerHTML = html;

  miniCalendarDiv.addEventListener('click', (event) => {
      const targetCell = event.target.closest('.date-cell');
      if (targetCell) {
        const fullDate = targetCell.dataset.fullDate;
        // Parse date manually to avoid UTC timezone shifts causing off-by-one errors
        const [y, m, d] = fullDate.split('-').map(Number);
        openFullCalendar(new Date(y, m - 1, d)); 
      } else if (event.target.closest('#miniCalendar')) { // Clicked somewhere in mini-calendar but not a date cell
        openFullCalendar(new Date()); // Open to current month/year
      }
  });

  // No need for a separate listener on the entire miniCalendarDiv if we handle it in the single click handler above
  /*
  miniCalendarDiv.addEventListener('click', (event) => {
    if (!event.target.closest('.date-cell')) { // If the click wasn't on a date cell
      openFullCalendar(new Date()); // Open to current month/year
    }
  });
  */
}

// --- Full Screen Calendar Modal Logic ---
const calendarModal = document.getElementById('calendarModal');
const closeModalBtn = document.querySelector('.calendar-modal .close-modal');
const currentMonthYearDisplay = document.getElementById('currentMonthYear');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const eventsListContainer = document.getElementById('eventsList'); // This is the container for events
const eventsListItems = document.getElementById('eventsListItems'); // The actual <ul> for events

let currentFullCalendarDate = new Date(); // Tracks the month/year shown in the full calendar

// Function to open the full calendar modal
function openFullCalendar(initialDate = new Date(), selectDay = true) {
  calendarModal.classList.add('show');
  currentFullCalendarDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1); // Set to start of month
  renderFullCalendar(selectDay ? initialDate : null);
}

function closeCalendarModal() {
  calendarModal.classList.remove('show');
}

// Event listener to close the modal using the close button
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeCalendarModal);
}

// Event listener to close the modal if clicking outside the content
if (calendarModal) {
  calendarModal.addEventListener('click', (event) => {
    if (event.target === calendarModal) {
      closeCalendarModal();
    }
  });
}

// Function to render the full calendar days
function renderFullCalendar(selectedDate = null) {
  const year = currentFullCalendarDate.getFullYear();
  const month = currentFullCalendarDate.getMonth(); // 0-indexed

  currentMonthYearDisplay.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  calendarGrid.innerHTML = ''; // Clear previous days
  eventsListItems.innerHTML = ''; // Clear previous events in the list

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fill leading empty days
  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('empty');
    calendarGrid.appendChild(emptyDiv);
  }

  // Fill days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('current-month-day');
    dayDiv.textContent = day;

    const today = new Date();
    // Ensure consistent date formatting: YYYY-MM-DD
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasEvent = calendarEvents[dateString] && calendarEvents[dateString].length > 0;

    // Check if this is today - compare year, month, and day independently to avoid timezone issues
    const isTodayDate = year === today.getFullYear() && 
                        month === today.getMonth() && 
                        day === today.getDate();
    
    if (isTodayDate) {
      dayDiv.classList.add('today');
    }
    
    if (hasEvent) {
      dayDiv.classList.add('event-day');
      // Add a visual indicator for events
      const eventDot = document.createElement('div');
      eventDot.classList.add('event-dot');
      dayDiv.appendChild(eventDot);
      // If any event for this date is marked as important, highlight the day
      if (calendarEvents[dateString].some(event => event.important)) {
        dayDiv.classList.add('important-event-day');
      }
    }

    // Add click listener for day selection (e.g., to show events)
    dayDiv.addEventListener('click', () => {
      // Remove 'selected' from previously selected day
      const previouslySelected = calendarGrid.querySelector('.current-month-day.selected');
      if (previouslySelected) {
        previouslySelected.classList.remove('selected');
      }
      dayDiv.classList.add('selected');
      displayDayEvents(dateString);
    });

    // If the full calendar was opened with a specific date, select it
    if (selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) {
      dayDiv.classList.add('selected');
      displayDayEvents(dateString); // Display events for the initially selected day
    }

    calendarGrid.appendChild(dayDiv);
  }
}

// Function to display events for a specific date string (YYYY-MM-DD)
function displayDayEvents(dateString) {
  const events = calendarEvents[dateString];
  eventsListItems.innerHTML = ''; // Clear previous events

  if (events && events.length > 0) {
    events.forEach(event => {
      const listItem = document.createElement('li');
      let eventHtml = `<h4>${event.title}</h4><p>${event.description}</p>`;
      if (event.important) {
        listItem.classList.add('important-event');
        eventHtml = `<span class="important-indicator">⭐</span> ${eventHtml}`;
      }
      listItem.innerHTML = eventHtml;
      eventsListItems.appendChild(listItem);
    });
  } else {
    const listItem = document.createElement('li');
    listItem.textContent = `No events for ${dateString}`;
    eventsListItems.appendChild(listItem);
  }
}

// Navigation buttons for full calendar
if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', () => {
    // Add fade-out animation
    calendarGrid.style.animation = 'none';
    setTimeout(() => {
      currentFullCalendarDate.setMonth(currentFullCalendarDate.getMonth() - 1);
      calendarGrid.style.animation = 'slideInCalendar 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      renderFullCalendar();
    }, 10);
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', () => {
    // Add fade-out animation
    calendarGrid.style.animation = 'none';
    setTimeout(() => {
      currentFullCalendarDate.setMonth(currentFullCalendarDate.getMonth() + 1);
      calendarGrid.style.animation = 'slideInCalendar 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      renderFullCalendar();
    }, 10);
  });
}

const apiUrl = 'http://localhost:5000/api';

// Check authentication and load user data
function initializeApp() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    // Redirect to login if not authenticated
    window.location.href = 'index.html';
    return;
  }

  // Load user data
  try {
    const userData = JSON.parse(user);
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userInitialsEl = document.getElementById('userInitials');
    
    const name = userData.username || userData.name || 'User';
    if (userNameEl) userNameEl.textContent = userData.username || userData.name || 'User';
    if (userEmailEl) userEmailEl.textContent = userData.email || '';
    if (userInitialsEl) userInitialsEl.textContent = name.charAt(0).toUpperCase();
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  // Initialize Theme
  const themeToggle = document.getElementById('themeToggle') || document.getElementById('themeBtn');
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    if (themeToggle) themeToggle.textContent = '☀️';
  } else {
    if (themeToggle) themeToggle.textContent = '🌙';
  }

  // Theme Toggle Listener
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const isLight = document.body.classList.contains('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggle.textContent = isLight ? '☀️' : '🌙';
    });
  }

  // Listen for theme changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      const isLight = e.newValue === 'light';
      if (isLight) {
        document.body.classList.add('light');
        if (themeToggle) themeToggle.textContent = '☀️';
      } else {
        document.body.classList.remove('light');
        if (themeToggle) themeToggle.textContent = '🌙';
      }
    }
  });

  // Logout Listener
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'form/form-home.html';
      }
    });
  }

  // Profile Dropdown Toggle
  const profileTrigger = document.getElementById('profileTrigger');
  const profileDropdown = document.getElementById('profileDropdown');
  
  if (profileTrigger && profileDropdown) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      profileDropdown.classList.remove('show');
    });
  }

  // Sidebar Header Toggle (Optional/Legacy)
  const sidebar = document.querySelector('.sidebar');
  const sidebarHeader = document.querySelector('.sidebar h2');
  if (sidebar && sidebarHeader) {
    sidebarHeader.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Initialize Calendar
  initMiniCalendar();
  fetchCalendarEvents();
}

// Fetch calendar events from backend
async function fetchCalendarEvents() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token found - calendar events not fetched');
      return;
    }

    console.log('🔄 Fetching calendar events from backend...');
    const response = await fetch(`${apiUrl}/calendar`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch calendar events:', response.status);
      return;
    }

    const events = await response.json();
    console.log(`📊 Received ${events.length} events from backend:`, events);
    
    // Reset and populate events
    calendarEvents = {};
    
    events.forEach(event => {
      // Format date to YYYY-MM-DD
      // The backend returns dates as YYYY-MM-DD strings in the database's local context
      // Do NOT apply timezone conversion - use the date string as-is
      let dateStr = event.event_date;
      let originalDate = dateStr;
      
      if (dateStr) {
        // Simply clean up the date string - remove time portion if present
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        } else if (dateStr.includes(' ')) {
          dateStr = dateStr.split(' ')[0];
        }
        
        // Ensure YYYY-MM-DD format
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        console.log(`✅ Event "${event.title}": ${originalDate} → ${dateStr}`);
      }
      
      if (!calendarEvents[dateStr]) {
        calendarEvents[dateStr] = [];
      }
      
      calendarEvents[dateStr].push({
        id: event.id,
        title: event.title,
        description: event.description || '',
        important: (event.title && event.title.includes('Important')) || false,
        time: event.event_time || null,
        location: event.location,
        event_date: event.event_date
      });
    });

    console.log('📅 Calendar events organized by date:', calendarEvents);
    
    // Refresh UI
    initMiniCalendar();
    if (document.getElementById('calendarModal').classList.contains('show')) {
      renderFullCalendar();
    }
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
  }
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', initializeApp);

// Expose for other components
window.fetchCalendarEvents = fetchCalendarEvents;