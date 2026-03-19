const pool = require('./config/database');

async function checkAccounts() {
  try {
    const [accounts] = await pool.query('SELECT * FROM email_accounts');
    console.log('📧 Email Accounts in database:');
    console.table(accounts);
    
    if (accounts.length === 0) {
      console.log('❌ No email accounts found');
    }
    
    const [emails] = await pool.query('SELECT COUNT(*) as count FROM emails');
    console.log('📨 Total emails in database:', emails[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

checkAccounts();
