const pool = require('./Backend/config/database');

(async () => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query('ALTER TABLE users ADD COLUMN timezone VARCHAR(100) DEFAULT "UTC" AFTER email');
    console.log('✅ Timezone column added successfully');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Timezone column already exists');
    } else {
      console.error('❌ Error:', e.message);
    }
  } finally {
    conn.release();
    pool.end();
  }
})();
