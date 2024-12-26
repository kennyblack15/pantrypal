const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ConfigService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.algorithm = 'aes-256-gcm';
  }

  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.encryptionKey, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, 'hex'),
      Buffer.from(encrypted.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async loadSecrets() {
    try {
      const secretsPath = path.join(__dirname, '../config/secrets.enc');
      if (fs.existsSync(secretsPath)) {
        const encryptedData = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
        return JSON.parse(this.decrypt(encryptedData));
      }
      return {};
    } catch (error) {
      console.error('Error loading secrets:', error);
      return {};
    }
  }

  async saveSecrets(secrets) {
    try {
      const encrypted = this.encrypt(JSON.stringify(secrets));
      const secretsPath = path.join(__dirname, '../config/secrets.enc');
      
      // Ensure directory exists
      const dir = path.dirname(secretsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(secretsPath, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Error saving secrets:', error);
      throw error;
    }
  }

  async rotateKeys() {
    try {
      const secrets = await this.loadSecrets();
      this.encryptionKey = this.generateEncryptionKey();
      await this.saveSecrets(secrets);
      return true;
    } catch (error) {
      console.error('Error rotating keys:', error);
      return false;
    }
  }

  validateApiKey(apiKey) {
    if (!apiKey) return false;
    
    // Add additional validation logic here
    const minLength = 32;
    const hasUpperCase = /[A-Z]/.test(apiKey);
    const hasLowerCase = /[a-z]/.test(apiKey);
    const hasNumbers = /\d/.test(apiKey);
    
    return (
      apiKey.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers
    );
  }

  async initializeSecrets() {
    const secrets = {
      apiKeys: {
        openai: process.env.OPENAI_API_KEY,
        googleCloud: process.env.GOOGLE_CLOUD_API_KEY,
        other: {}
      },
      database: {
        mongodb: {
          uri: process.env.MONGODB_URI,
          options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
          }
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD
        }
      },
      jwt: {
        secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        expiresIn: '24h'
      },
      security: {
        encryptionKey: this.encryptionKey,
        passwordSaltRounds: 12
      }
    };

    await this.saveSecrets(secrets);
    return secrets;
  }
}

module.exports = new ConfigService();
