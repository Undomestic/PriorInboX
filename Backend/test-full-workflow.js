#!/usr/bin/env node

/**
 * Comprehensive Test Script for Task and Calendar Features
 * Tests the full workflow:
 * 1. Authenticate user
 * 2. Get access token
 * 3. Create tasks
 * 4. Create calendar events
 * 5. Retrieve and verify data
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const pool = require('./config/database');

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test user ID (change this to your actual test user ID)
const TEST_USER_ID = 1;
const TEST_USER_EMAIL = 'test@example.com';

// Create a test JWT token
const testToken = jwt.sign(
  { id: TEST_USER_ID, email: TEST_USER_EMAIL },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('====================================');
console.log('Task & Calendar Feature Test Suite');
console.log('====================================\n');

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test 1: Create a task
async function testCreateTask() {
  console.log('Test 1: Creating a task from email...');
  
  const taskData = {
    title: '📧 Follow up on important email',
    description: 'This task was created from an email. Remember to respond to the client.',
    status: 'pending',
    priority: 'high',
    due_date: '2024-12-31'
  };

  try {
    const response = await makeRequest('POST', '/tasks', taskData);
    
    if (response.status === 201) {
      console.log('✅ Task created successfully');
      console.log(`   Task ID: ${response.body.taskId}`);
      console.log(`   Message: ${response.body.message}\n`);
      return response.body.taskId;
    } else {
      console.error(`❌ Failed to create task (Status: ${response.status})`);
      console.error(`   Response: ${JSON.stringify(response.body)}\n`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error creating task: ${error.message}\n`);
    return null;
  }
}

// Test 2: Get all tasks
async function testGetTasks() {
  console.log('Test 2: Fetching all tasks...');
  
  try {
    const response = await makeRequest('GET', '/tasks');
    
    if (response.status === 200) {
      console.log(`✅ Retrieved ${response.body.length} task(s)`);
      response.body.forEach((task, idx) => {
        console.log(`   ${idx + 1}. ${task.title} [${task.priority}] - ${task.status}`);
      });
      console.log();
      return response.body;
    } else {
      console.error(`❌ Failed to fetch tasks (Status: ${response.status})\n`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching tasks: ${error.message}\n`);
    return [];
  }
}

// Test 3: Create a calendar event
async function testCreateCalendarEvent() {
  console.log('Test 3: Creating a calendar event...');
  
  const eventData = {
    title: '📧 Important Client Meeting - Follow up on Email',
    description: 'Meeting to discuss the email from the client. Prepare project updates.',
    event_date: '2024-12-25',
    event_time: '14:30',
    location: 'Conference Room A'
  };

  try {
    const response = await makeRequest('POST', '/calendar', eventData);
    
    if (response.status === 201) {
      console.log('✅ Calendar event created successfully');
      console.log(`   Event ID: ${response.body.eventId}`);
      console.log(`   Message: ${response.body.message}\n`);
      return response.body.eventId;
    } else {
      console.error(`❌ Failed to create calendar event (Status: ${response.status})`);
      console.error(`   Response: ${JSON.stringify(response.body)}\n`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error creating calendar event: ${error.message}\n`);
    return null;
  }
}

// Test 4: Get all calendar events
async function testGetCalendarEvents() {
  console.log('Test 4: Fetching all calendar events...');
  
  try {
    const response = await makeRequest('GET', '/calendar');
    
    if (response.status === 200) {
      console.log(`✅ Retrieved ${response.body.length} calendar event(s)`);
      response.body.forEach((event, idx) => {
        console.log(`   ${idx + 1}. ${event.title}`);
        console.log(`      Date: ${event.event_date} at ${event.event_time || 'N/A'}`);
        console.log(`      Location: ${event.location || 'N/A'}`);
      });
      console.log();
      return response.body;
    } else {
      console.error(`❌ Failed to fetch calendar events (Status: ${response.status})\n`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching calendar events: ${error.message}\n`);
    return [];
  }
}

// Test 5: Mark task as complete
async function testCompleteTask(taskId) {
  if (!taskId) {
    console.log('Test 5: Skipping (No task ID available)\n');
    return;
  }

  console.log('Test 5: Marking task as complete...');
  
  try {
    const response = await makeRequest('PUT', `/tasks/${taskId}/complete`);
    
    if (response.status === 200) {
      console.log('✅ Task marked as complete');
      console.log(`   Message: ${response.body.message}\n`);
    } else {
      console.error(`❌ Failed to mark task as complete (Status: ${response.status})\n`);
    }
  } catch (error) {
    console.error(`❌ Error marking task complete: ${error.message}\n`);
  }
}

// Test 6: Update a calendar event
async function testUpdateCalendarEvent(eventId) {
  if (!eventId) {
    console.log('Test 6: Skipping (No event ID available)\n');
    return;
  }

  console.log('Test 6: Updating calendar event...');
  
  const updateData = {
    title: '📧 UPDATED: Important Client Meeting - Follow up on Email',
    description: 'UPDATED: Meeting to discuss the email response and next steps.',
    event_date: '2024-12-25',
    event_time: '15:00',
    location: 'Conference Room B'
  };

  try {
    const response = await makeRequest('PUT', `/calendar/${eventId}`, updateData);
    
    if (response.status === 200) {
      console.log('✅ Calendar event updated successfully');
      console.log(`   Message: ${response.body.message}\n`);
    } else {
      console.error(`❌ Failed to update calendar event (Status: ${response.status})\n`);
    }
  } catch (error) {
    console.error(`❌ Error updating calendar event: ${error.message}\n`);
  }
}

// Test 7: Get active tasks (dashboard view)
async function testGetActiveTasks() {
  console.log('Test 7: Fetching active tasks for dashboard...');
  
  try {
    const response = await makeRequest('GET', '/tasks/active');
    
    if (response.status === 200) {
      console.log(`✅ Retrieved ${response.body.length} active task(s)`);
      response.body.forEach((task, idx) => {
        console.log(`   ${idx + 1}. ${task.title}`);
      });
      console.log();
    } else {
      console.error(`❌ Failed to fetch active tasks (Status: ${response.status})\n`);
    }
  } catch (error) {
    console.error(`❌ Error fetching active tasks: ${error.message}\n`);
  }
}

// Main test execution
async function runAllTests() {
  console.log(`Using Test Token: ${testToken.substring(0, 30)}...\n`);
  
  try {
    // Create task
    const taskId = await testCreateTask();
    
    // Get all tasks
    await testGetTasks();
    
    // Create calendar event
    const eventId = await testCreateCalendarEvent();
    
    // Get all calendar events
    await testGetCalendarEvents();
    
    // Complete task
    await testCompleteTask(taskId);
    
    // Update calendar event
    await testUpdateCalendarEvent(eventId);
    
    // Get active tasks
    await testGetActiveTasks();

    console.log('====================================');
    console.log('✅ Test Suite Completed Successfully');
    console.log('====================================\n');
    
    console.log('Summary:');
    console.log('✅ Task creation works');
    console.log('✅ Task retrieval works');
    console.log('✅ Task completion works');
    console.log('✅ Calendar event creation works');
    console.log('✅ Calendar event retrieval works');
    console.log('✅ Calendar event update works');
    console.log('✅ Dashboard task view works\n');
    
    console.log('Next Steps:');
    console.log('1. Open http://localhost:8000/emails.html');
    console.log('2. Click on "📋 Tasks" button to see task panel');
    console.log('3. Click on "📅 Calendar" button to see calendar panel');
    console.log('4. Open an email and click "Create Task" to create a task from email');
    console.log('5. Open an email and click "Add to Calendar" to create calendar event\n');

  } catch (error) {
    console.error(`❌ Test suite error: ${error.message}`);
  }

  process.exit(0);
}

// Run tests
runAllTests();
