const pool = require('./config/database');
const jwt = require('jsonwebtoken');

// Test data
const testUserId = 1; // Change this to your test user ID
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

// Create a test token
const testToken = jwt.sign({ id: testUserId, email: 'test@example.com' }, jwtSecret, { expiresIn: '24h' });

console.log('Testing Task and Calendar Endpoints\n');
console.log('Test Token:', testToken, '\n');

async function testTasks() {
  try {
    console.log('1. Creating a test task...');
    
    const response = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Task from Email',
        description: 'This is a test task created from an email',
        status: 'pending',
        priority: 'high',
        due_date: '2024-12-31'
      })
    });

    const taskResult = await response.json();
    console.log('Task Creation Response:', taskResult);
    console.log('Status:', response.status, '\n');

    if (!response.ok) {
      console.error('Task creation failed!');
      return;
    }

    // Get tasks
    console.log('2. Fetching all tasks...');
    const getResponse = await fetch('http://localhost:5000/api/tasks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    const tasks = await getResponse.json();
    console.log('Tasks:', tasks);
    console.log('Total tasks:', tasks.length, '\n');

  } catch (error) {
    console.error('Task test error:', error);
  }
}

async function testCalendar() {
  try {
    console.log('3. Creating a test calendar event...');
    
    const response = await fetch('http://localhost:5000/api/calendar/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Important Email Follow-up',
        description: 'Follow up on important email',
        event_date: '2024-12-25',
        event_time: '10:00'
      })
    });

    const eventResult = await response.json();
    console.log('Calendar Event Creation Response:', eventResult);
    console.log('Status:', response.status, '\n');

    if (!response.ok) {
      console.error('Calendar event creation failed!');
      return;
    }

    // Get calendar events
    console.log('4. Fetching all calendar events...');
    const getResponse = await fetch('http://localhost:5000/api/calendar/events', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    const events = await getResponse.json();
    console.log('Calendar Events:', events);
    console.log('Total events:', events.length, '\n');

  } catch (error) {
    console.error('Calendar test error:', error);
  }
}

// Run tests
(async () => {
  await testTasks();
  await testCalendar();
  process.exit(0);
})();
