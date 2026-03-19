#!/usr/bin/env node

/**
 * Google OAuth Configuration Test
 * Tests if Google OAuth credentials are properly configured
 */

require('dotenv').config();
const axios = require('axios');

console.log('\n🔍 Google OAuth Configuration Test\n');
console.log('=' .repeat(50));

// Check if credentials are configured
const checks = {
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  'GOOGLE_CALLBACK_URL': process.env.GOOGLE_CALLBACK_URL,
  'GMAIL_CLIENT_ID': process.env.GMAIL_CLIENT_ID,
  'GMAIL_CLIENT_SECRET': process.env.GMAIL_CLIENT_SECRET,
  'GMAIL_REDIRECT_URI': process.env.GMAIL_REDIRECT_URI,
};

console.log('\n✅ Configuration Status:\n');
let allConfigured = true;

for (const [key, value] of Object.entries(checks)) {
  if (value && !value.includes('YOUR_')) {
    console.log(`✓ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`✗ ${key}: NOT CONFIGURED`);
    allConfigured = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allConfigured) {
  console.log('\n✅ Google OAuth is properly configured!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start the backend server: npm start');
  console.log('2. Visit: http://localhost:5000/api/auth/google');
  console.log('3. You will be redirected to Google login');
  console.log('4. After authentication, you\'ll be redirected with a token\n');
} else {
  console.log('\n❌ Missing Google OAuth configuration!');
  console.log('\n📝 To configure:');
  console.log('1. Update Backend/.env with Google OAuth credentials');
  console.log('2. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set');
  console.log('3. Run this test again\n');
}

console.log('═'.repeat(50));
