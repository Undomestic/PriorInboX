const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'b@dm@n2006',
  database: process.env.DB_NAME || 'priorinbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,  // 5 second timeout
  timezone: '+00:00',  // Force UTC timezone for consistent date handling
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: ['DATE', 'DATETIME', 'TIMESTAMP']  // Return date types as strings, not Date objects
});

// Test connection with timeout
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    console.error('⚠️  Make sure MySQL is running on localhost:3306');
    return false;
  }
};

// Run test but don't block startup
setTimeout(() => {
  testConnection();
}, 1000);

module.exports = pool;
