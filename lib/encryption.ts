import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'edirne-sydv-secret-key-2024';

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
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
