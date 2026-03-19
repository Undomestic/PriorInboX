/**
 * Add password reset columns to users table
 * Run: node add-password-reset.js
 */

const mysql = require('mysql2/promise');

async function addPasswordResetColumns() {
  let conn;
  try {
    // Create connection
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'priorinbox'
    });

    console.log('✅ Connected to database');

    // Add reset code column
    try {
      await conn.execute(`
        ALTER TABLE users ADD COLUMN reset_code VARCHAR(10) DEFAULT NULL
      `);
      console.log('✅ Added reset_code column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ reset_code column already exists');
      } else {
        throw err;
      }
    }

    // Add reset token column
    try {
      await conn.execute(`
        ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL
      `);
      console.log('✅ Added reset_token column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ reset_token column already exists');
      } else {
        throw err;
      }
    }

    // Add reset expiry column
    try {
      await conn.execute(`
        ALTER TABLE users ADD COLUMN reset_expiry DATETIME DEFAULT NULL
      `);
      console.log('✅ Added reset_expiry column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ reset_expiry column already exists');
      } else {
        throw err;
      }
    }

    console.log('✅ All password reset columns added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

addPasswordResetColumns();
