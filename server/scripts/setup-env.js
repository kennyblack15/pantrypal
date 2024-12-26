#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generateSecureKey() {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  console.log('PantryPal Environment Setup\n');

  try {
    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');

    // Create .env from .env.example if it doesn't exist
    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
    }

    const setupType = await question(
      'Choose setup type:\n' +
      '1. Development\n' +
      '2. Production\n' +
      '3. Testing\n' +
      'Enter choice (1-3): '
    );

    const envConfig = {
      NODE_ENV: ['development', 'production', 'test'][parseInt(setupType) - 1],
      PORT: await question('\nEnter port number (default: 5000): ') || '5000',
      
      // Generate secure keys
      JWT_SECRET: await generateSecureKey(),
      ENCRYPTION_KEY: await generateSecureKey(),
      
      // Database configuration
      MONGODB_URI: await question('\nEnter MongoDB URI: '),
      
      // Redis configuration
      REDIS_HOST: await question('\nEnter Redis host (default: localhost): ') || 'localhost',
      REDIS_PORT: await question('Enter Redis port (default: 6379): ') || '6379',
      REDIS_PASSWORD: await question('Enter Redis password (optional): '),
      
      // API Keys
      OPENAI_API_KEY: await question('\nEnter OpenAI API key: '),
      GOOGLE_CLOUD_API_KEY: await question('Enter Google Cloud API key: '),
      
      // Security settings
      CORS_ORIGIN: await question('\nEnter CORS origin (default: http://localhost:3000): ') || 'http://localhost:3000',
      RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
      RATE_LIMIT_MAX_REQUESTS: '100',
      
      // Session configuration
      SESSION_SECRET: await generateSecureKey(),
      SESSION_DURATION: '86400000', // 24 hours
      
      // Logging
      LOG_LEVEL: setupType === '1' ? 'debug' : 'info',
      
      // Feature flags
      ENABLE_CACHE: 'true',
      ENABLE_RATE_LIMIT: setupType === '2' ? 'true' : 'false',
      
      // Backup configuration
      BACKUP_ENABLED: setupType === '2' ? 'true' : 'false',
      BACKUP_INTERVAL: '86400000', // 24 hours
      BACKUP_PATH: './backups',
      
      // Monitoring
      ENABLE_MONITORING: setupType === '2' ? 'true' : 'false',
      METRICS_PORT: '9090'
    };

    // Generate .env file content
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Write to .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\nEnvironment setup complete! The following files were created/updated:');
    console.log(`- ${envPath}`);

    // Create gitignore if it doesn't exist
    const gitignorePath = path.join(__dirname, '../.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const gitignoreContent = `
# Environment variables
.env
.env.*
!.env.example

# Keys and certificates
*.pem
*.key
*.crt
*.cert
*.keystore

# Logs
logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Dependency directories
node_modules/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Build output
dist/
build/

# Coverage directory
coverage/

# Backup files
backups/

# IDE specific files
.idea/
.vscode/
*.swp
*.swo
`;
      fs.writeFileSync(gitignorePath, gitignoreContent.trim());
      console.log(`- ${gitignorePath}`);
    }

    // Security recommendations
    console.log('\nSecurity Recommendations:');
    console.log('1. Store all sensitive keys in a secure password manager');
    console.log('2. Enable 2FA for all service accounts');
    console.log('3. Regularly rotate API keys and secrets');
    console.log('4. Monitor application logs for suspicious activity');
    console.log('5. Keep all dependencies updated');
    console.log('6. Use HTTPS in production');
    console.log('7. Implement proper backup procedures');

  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    rl.close();
  }
}

main();
