const pool = require('./Backend/config/database');

(async () => {
  const conn = await pool.getConnection();
  try {
    // Check if timezone column exists
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'timezone'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Timezone column exists in users table');
      
      // Check a sample user
      const [users] = await conn.query('SELECT id, email, timezone FROM users LIMIT 1');
      if (users.length > 0) {
        console.log('📌 Sample user:', users[0]);
      } else {
        console.log('ℹ️ No users in database yet');
      }
    } else {
      console.log('❌ Timezone column does NOT exist');
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    conn.release();
    pool.end();
  }
})();
