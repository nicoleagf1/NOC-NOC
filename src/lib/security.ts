import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// La máscara que se enviará al frontend para ocultar el secreto
export const MASK = '••••••••';

/**
 * Verifica si el string enviado desde el frontend es una máscara.
 */
export function isMasked(text: string): boolean {
  return text === MASK;
}

/**
 * Cifra un texto usando AES-256-CBC
 */
export function encrypt(text: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error('APP_SECRET no está configurado en las variables de entorno.');
  }
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secret, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Descifra un texto previamente cifrado con encrypt()
 */
export function decrypt(encryptedText: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error('APP_SECRET no está configurado en las variables de entorno.');
  }
  if (!encryptedText) return encryptedText;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Formato cifrado inválido.');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secret, 'hex'), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
