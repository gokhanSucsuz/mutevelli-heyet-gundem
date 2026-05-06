import CryptoJS from 'crypto-js';

const KEY = process.env.ENCRYPTION_KEY;

if (!KEY) {
  // During build time on some CI environments, this might be missing, 
  // but we need it for runtime. We add a check but ensure type narrowing.
  console.warn('ENCRYPTION_KEY is missing');
}

const ENCRYPTION_KEY = KEY || 'build-time-fallback-never-use-in-prod';

export function encryptData(data: any): string {
  if (!data) return '';
  const jsonStr = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, ENCRYPTION_KEY).toString();
}

export function decryptData(encryptedStr: string): any {
  if (!encryptedStr) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedStr, ENCRYPTION_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedData) return null;
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
