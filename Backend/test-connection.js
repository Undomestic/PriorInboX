const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testConnection() {
  try {
    console.log('🔍 Testing MySQL Connection...\n');
    console.log('📋 Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '(set)' : '(empty)'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'priorinbox'}\n`);

    // First test - connect without database
    console.log('Step 1: Connecting to MySQL server...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Successfully connected to MySQL!\n');

    // Create database
    console.log('Step 2: Creating database...');
    await connection.query('CREATE DATABASE IF NOT EXISTS priorinbox');
    console.log('✅ Database created/exists\n');

    // Select database
    console.log('Step 3: Selecting database...');
    await connection.query('USE priorinbox');
    console.log('✅ Database selected\n');

    // Create tables
    console.log('Step 4: Creating tables...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);
    console.log('   ✅ Users table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        due_date DATE,
        source_email_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('   ✅ Tasks table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_time TIME,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_event_date (event_date)
      )
    `);
    console.log('   ✅ Calendar events table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email_account_id INT,
        from_address VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body LONGTEXT,
        message_id VARCHAR(255) UNIQUE,
        is_read BOOLEAN DEFAULT FALSE,
        is_important BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (email_account_id) REFERENCES email_accounts(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_is_important (is_important),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('   ✅ Emails table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        provider ENUM('gmail', 'outlook', 'yahoo', 'other') DEFAULT 'gmail',
        access_token TEXT,
        refresh_token TEXT,
        is_connected BOOLEAN DEFAULT TRUE,
        last_synced TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_email_per_user (user_id, email),
        INDEX idx_user_id (user_id),
        INDEX idx_is_connected (is_connected)
      )
    `);
    console.log('   ✅ Email accounts table\n');

    await connection.end();

    console.log('🎉 Setup completed successfully!');
    console.log('\n📝 You can now run: npm run dev\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.error('\n⚠️  Troubleshooting:');
    console.error('   1. Make sure MySQL Server is running');
    console.error('   2. Verify your username is "root"');
    console.error('   3. Check your password in .env file');
    console.error('   4. Run: mysql -u root -p (to test MySQL)\n');
    process.exit(1);
  }
}

testConnection();
