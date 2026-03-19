const pool = require('./config/database');
const gmailService = require('./services/gmailService');

async function testSync() {
  try {
    console.log('🧪 Testing email sync...');
    
    // Get the test account
    const [accounts] = await pool.query(
      'SELECT * FROM email_accounts WHERE email = ?',
      ['jyotiraditya261@gmail.com']
    );
    
    if (accounts.length === 0) {
      console.log('❌ No test account found');
      process.exit(1);
    }
    
    const account = accounts[0];
    console.log('📧 Found account:', account.email);
    
    // Sync emails
    console.log('🔄 Starting sync...');
    const result = await gmailService.syncEmailsToDatabase(
      account.user_id,
      account.id,
      account.access_token,
      account.refresh_token,
      account.provider
    );
    
    console.log('✅ Sync result:', result);
    
    // Check how many emails are in DB now
    const [emailCount] = await pool.query('SELECT COUNT(*) as count FROM emails');
    console.log('📨 Total emails in database:', emailCount[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSync();
