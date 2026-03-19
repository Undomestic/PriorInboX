// Check MySQL Status
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkMySQL() {
  console.log('🔍 Checking MySQL Connection...\n');
  
  try {
    console.log(`Attempting to connect to: ${process.env.DB_HOST || 'localhost'}:3306`);
    console.log(`Database: ${process.env.DB_NAME || 'priorinbox'}`);
    console.log(`User: ${process.env.DB_USER || 'root'}\n`);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'priorinbox',
      connectTimeout: 3000
    });
    
    console.log('✅ SUCCESS: Connected to MySQL!');
    
    // Check if tables exist
    const [tables] = await connection.query("SHOW TABLES");
    console.log(`\n📊 Tables found: ${tables.length}`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    await connection.end();
    
  } catch (err) {
    console.error('❌ FAILED: Cannot connect to MySQL');
    console.error('\nError:', err.message);
    console.error('\nSolution:');
    console.error('1. Make sure MySQL Server is running');
    console.error('2. Check credentials in your .env file');
    console.error('3. Verify database "priorinbox" exists');
    console.error('\nOn Windows:');
    console.error('   - Open Services and start "MySQL80" or "MySQL57"');
    console.error('   - Or run: net start MySQL80');
    console.error('\nOn Mac:');
    console.error('   - brew services start mysql');
    console.error('\nOn Linux:');
    console.error('   - sudo service mysql start');
  }
}

checkMySQL();
