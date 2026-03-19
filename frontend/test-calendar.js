// Test script to debug calendar date issue
const API_URL = 'http://localhost:5000/api';

async function testCalendarDates() {
  try {
    // First, let's test if we can get calendar events
    console.log('Testing calendar events endpoint...');
    
    // Note: This will fail without a valid token, but we can see the response format
    const response = await fetch(`${API_URL}/calendar`);
    const data = await response.json();
    
    console.log('Response:', data);
    
    if (Array.isArray(data)) {
      console.log('Events returned:');
      data.forEach(event => {
        console.log(`- ${event.title}: ${event.event_date}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCalendarDates();
