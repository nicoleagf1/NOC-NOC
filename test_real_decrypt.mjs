import crypto from 'crypto';
import fs from 'fs';

const envConfig = fs.readFileSync('.env.local', 'utf-8');
let secret = '';
envConfig.split('\n').forEach(line => {
  if (line.startsWith('APP_SECRET=')) {
    secret = line.split('=')[1].trim();
  }
});

const cipherText = 'c47f5940cfda9c18f50cd42af6eb27a5:b2a55ebf7cafbdf27a95193db8a91f2e';

try {
  const parts = cipherText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  console.log("Decrypted:", decrypted);
} catch (e) {
  console.error("Error:", e.message);
}
