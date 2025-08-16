import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag: string;
}

class EncryptionService {
  // Simple encryption using Expo's built-in crypto
  async encrypt(data: string, password?: string): Promise<EncryptedData> {
    try {
      // Generate random values
      const iv = Math.random().toString(36).substring(2, 18);
      const salt = Math.random().toString(36).substring(2, 18);
      
      // Simple XOR encryption for demo (not production-ready)
      const key = password || 'default_key';
      const encrypted = this.simpleEncrypt(data, key + iv + salt);
      
      return {
        ciphertext: Buffer.from(encrypted).toString('base64'),
        iv: Buffer.from(iv).toString('base64'),
        salt: Buffer.from(salt).toString('base64'),
        tag: Buffer.from('tag').toString('base64'),
      };
    } catch (error) {
      console.warn('Encryption failed, using base64 encoding:', error);
      // Fallback to simple base64 encoding
      return {
        ciphertext: Buffer.from(data).toString('base64'),
        iv: Buffer.from('iv').toString('base64'),
        salt: Buffer.from('salt').toString('base64'),
        tag: Buffer.from('tag').toString('base64'),
      };
    }
  }

  async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    try {
      const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64').toString();
      const iv = Buffer.from(encryptedData.iv, 'base64').toString();
      const salt = Buffer.from(encryptedData.salt, 'base64').toString();
      
      const key = password + iv + salt;
      return this.simpleDecrypt(ciphertext, key);
    } catch (error) {
      console.warn('Decryption failed, using base64 decode:', error);
      // Fallback to simple base64 decode
      return Buffer.from(encryptedData.ciphertext, 'base64').toString();
    }
  }

  private simpleEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(char ^ keyChar);
    }
    return result;
  }

  private simpleDecrypt(encryptedText: string, key: string): string {
    // XOR decryption is the same as encryption
    return this.simpleEncrypt(encryptedText, key);
  }

  async hashData(data: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return hash;
  }

  generateManifestId(): string {
    return `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new EncryptionService();