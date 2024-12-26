#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const configService = require('../services/configService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generateNewKey() {
  return crypto.randomBytes(32).toString('hex');
}

async function encryptKey(key, masterKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(masterKey, 'hex'), iv);
  
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
}

async function main() {
  console.log('PantryPal Key Management Utility\n');
  
  try {
    const action = await question(
      'Choose an action:\n' +
      '1. Generate new API keys\n' +
      '2. Rotate encryption keys\n' +
      '3. Backup current keys\n' +
      '4. Import keys from backup\n' +
      '5. View current key status\n' +
      'Enter choice (1-5): '
    );

    switch (action) {
      case '1':
        const keyType = await question(
          '\nWhat type of key to generate?\n' +
          '1. OpenAI API Key\n' +
          '2. Google Cloud API Key\n' +
          '3. JWT Secret\n' +
          '4. Database Encryption Key\n' +
          'Enter choice (1-4): '
        );

        const newKey = await generateNewKey();
        const secrets = await configService.loadSecrets();

        switch (keyType) {
          case '1':
            secrets.apiKeys.openai = newKey;
            break;
          case '2':
            secrets.apiKeys.googleCloud = newKey;
            break;
          case '3':
            secrets.jwt.secret = newKey;
            break;
          case '4':
            secrets.security.encryptionKey = newKey;
            break;
        }

        await configService.saveSecrets(secrets);
        console.log('\nNew key generated and saved successfully!');
        break;

      case '2':
        const rotated = await configService.rotateKeys();
        if (rotated) {
          console.log('\nKeys rotated successfully!');
        } else {
          console.log('\nError rotating keys.');
        }
        break;

      case '3':
        const secrets3 = await configService.loadSecrets();
        const backupPath = path.join(__dirname, '../config/backup', `secrets-${Date.now()}.enc`);
        
        // Create backup directory if it doesn't exist
        const backupDir = path.dirname(backupPath);
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const masterKey = await generateNewKey();
        const encryptedBackup = await encryptKey(JSON.stringify(secrets3), masterKey);
        
        fs.writeFileSync(backupPath, JSON.stringify(encryptedBackup));
        console.log(`\nBackup created at: ${backupPath}`);
        console.log(`Master key (save this securely): ${masterKey}`);
        break;

      case '4':
        const backupFile = await question('\nEnter backup file path: ');
        const masterKeyImport = await question('Enter master key: ');
        
        if (fs.existsSync(backupFile)) {
          const encryptedData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
          const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(masterKeyImport, 'hex'),
            Buffer.from(encryptedData.iv, 'hex')
          );
          
          decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
          
          let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          
          await configService.saveSecrets(JSON.parse(decrypted));
          console.log('\nKeys restored successfully!');
        } else {
          console.log('\nBackup file not found!');
        }
        break;

      case '5':
        const currentSecrets = await configService.loadSecrets();
        console.log('\nCurrent Key Status:');
        console.log('OpenAI API Key:', currentSecrets.apiKeys.openai ? 'Set' : 'Not Set');
        console.log('Google Cloud API Key:', currentSecrets.apiKeys.googleCloud ? 'Set' : 'Not Set');
        console.log('JWT Secret:', currentSecrets.jwt.secret ? 'Set' : 'Not Set');
        console.log('Encryption Key:', currentSecrets.security.encryptionKey ? 'Set' : 'Not Set');
        break;

      default:
        console.log('\nInvalid choice!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

main();
