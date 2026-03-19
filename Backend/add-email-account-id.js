const pool = require('./config/database');

async function addEmailAccountId() {
  try {
    console.log('🔧 Adding email_account_id column to emails table...');
    
    // Check if column exists
    const [columns] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'emails' AND COLUMN_NAME = 'email_account_id'"
    );
    
    if (columns.length > 0) {
      console.log('✅ Column already exists');
      process.exit(0);
    }
    
    // Add column
    await pool.query(`
      ALTER TABLE emails 
      ADD COLUMN email_account_id INT,
      ADD FOREIGN KEY (email_account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
    `);
    
    console.log('✅ Column email_account_id added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addEmailAccountId();
