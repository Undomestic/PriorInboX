const pool = require('./config/database');

async function setupOAuthTable() {
  try {
    const conn = await pool.getConnection();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS oauth_states (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        state_token VARCHAR(255) NOT NULL UNIQUE,
        provider VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_state_token (state_token),
        INDEX idx_expires_at (expires_at)
      )
    `;
    
    await conn.execute(createTableSQL);
    console.log('✅ oauth_states table created successfully');
    
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating oauth_states table:', error.message);
    process.exit(1);
  }
}

setupOAuthTable();
