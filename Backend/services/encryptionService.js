const crypto = require('crypto');

// Encryption service for storing sensitive credentials securely
class EncryptionService {
  constructor() {
    // Use environment variable for encryption key
    // In production, store this in a secure vault (AWS KMS, HashiCorp Vault, etc.)
    this.encryptionKey = Buffer.from(
      process.env.ENCRYPTION_KEY || '32bytesecureencryptionkeyhere123',
      'utf8'
    ).slice(0, 32); // Ensure exactly 32 bytes for AES-256
    
    this.algorithm = 'aes-256-gcm';
    this.tagLength = 16; // Authentication tag length in bytes
    this.saltLength = 16; // Salt length in bytes
  }

  /**
   * Encrypt sensitive data (tokens, credentials)
   * @param {string} plaintext - Data to encrypt
   * @returns {string} Encrypted data in base64 format with IV and auth tag
   */
  encrypt(plaintext) {
    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);
      
      // Generate random salt for key derivation (extra security layer)
      const salt = crypto.randomBytes(this.saltLength);
      
      // Derive key from main encryption key + salt
      const derivedKey = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, 'sha256');
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine all components: salt + iv + authTag + encrypted data
      // Format: salt(16) + iv(16) + authTag(16) + encrypted(variable)
      const combined = Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')]);
      
      // Return as base64 for storage in database
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt encrypted data
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData) {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + 16);
      const authTag = combined.slice(this.saltLength + 16, this.saltLength + 16 + this.tagLength);
      const encrypted = combined.slice(this.saltLength + 16 + this.tagLength);
      
      // Derive same key using salt
      const derivedKey = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, 'sha256');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
      
      // Set authentication tag
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash a value (non-reversible) for verification
   * @param {string} data - Data to hash
   * @returns {string} SHA256 hash in hex format
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a random token
   * @param {number} length - Token length in bytes
   * @returns {string} Random token in hex format
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionService();
