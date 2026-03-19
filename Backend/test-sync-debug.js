const pool = require('./config/database');
const gmailService = require('./services/gmailService');
const encryptionService = require('./services/encryptionService');

async function debugSync() {
  try {
    console.log('🧪 Testing email sync with debugging...\n');
    
    // Get a connected email account
    const [accounts] = await pool.query(
      'SELECT * FROM email_accounts WHERE provider = ? AND is_connected = ?',
      ['gmail', true]
    );
    
    if (accounts.length === 0) {
      console.log('❌ No connected Gmail accounts found');
      process.exit(1);
    }
    
    const account = accounts[0];
    console.log('📧 Found account:', account.email);
    console.log('   ID:', account.id);
    console.log('   User ID:', account.user_id);
    console.log('   Has access token:', !!account.access_token);
    console.log('   Has refresh token:', !!account.refresh_token);
    console.log('');
    
    // Try to decrypt the access token
    try {
      console.log('🔑 Attempting to decrypt access token...');
      const decryptedToken = encryptionService.decrypt(account.access_token);
      console.log('✅ Successfully decrypted access token');
      console.log('   Token starts with:', decryptedToken.substring(0, 20) + '...');
      console.log('   Token length:', decryptedToken.length);
    } catch (decryptError) {
      console.error('❌ Failed to decrypt access token:', decryptError.message);
      process.exit(1);
    }
    
    console.log('');
    console.log('🔄 Starting sync...');
    const result = await gmailService.syncEmailsToDatabase(
      account.user_id,
      account.id,
      account.access_token,
      account.refresh_token,
      account.provider
    );
    
    console.log('✅ Sync completed:', result);
    
    // Check database
    const [emails] = await pool.query(
      'SELECT COUNT(*) as count FROM emails WHERE email_account_id = ?',
      [account.id]
    );
    
    console.log('\n📊 Emails in database for this account:', emails[0].count);
    
    // Show some email details
    const [emailList] = await pool.query(
      'SELECT id, from_address, subject, is_important, is_read FROM emails WHERE email_account_id = ? LIMIT 5',
      [account.id]
    );
    
    if (emailList.length > 0) {
      console.log('\n📧 Sample emails:');
      emailList.forEach((email, idx) => {
        console.log(`   ${idx + 1}. ${email.from_address} - ${email.subject.substring(0, 50)}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  }
}

debugSync();
