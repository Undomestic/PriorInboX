const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createDemoAccount() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database');

    // Hash the password
    const hashedPassword = await bcrypt.hash('Demo@123', 10);

    // Check if demo user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['demo@priorinbox.com']
    );

    if (existingUsers.length > 0) {
      // Update existing demo account password
      await connection.execute(
        'UPDATE users SET password = ?, username = ? WHERE email = ?',
        [hashedPassword, 'demo', 'demo@priorinbox.com']
      );
      console.log('✅ Demo account password reset successfully!');
    } else {
      // Insert new demo user
      await connection.execute(
        'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
        ['demo', 'demo@priorinbox.com', hashedPassword]
      );
      console.log('✅ Demo account created successfully!');
    }

    console.log('');
    console.log('📧 Email: demo@priorinbox.com');
    console.log('🔑 Password: Demo@123');
    console.log('👤 Username: demo');
    console.log('');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createDemoAccount();
