import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag: string;
}

class EncryptionService {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordBuffer = this.encoder.encode(password);
    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string, password?: string): Promise<EncryptedData> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Use provided password or generate random key
    const key = password 
      ? await this.generateKey(password, salt)
      : await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

    const dataBuffer = this.encoder.encode(data);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Extract tag (last 16 bytes)
    const encrypted = new Uint8Array(encryptedBuffer);
    const ciphertext = encrypted.slice(0, -16);
    const tag = encrypted.slice(-16);

    return {
      ciphertext: Buffer.from(ciphertext).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      salt: Buffer.from(salt).toString('base64'),
      tag: Buffer.from(tag).toString('base64'),
    };
  }

  async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');

    const key = await this.generateKey(password, salt);

    // Combine ciphertext and tag for AES-GCM
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      combined
    );

    return this.decoder.decode(decryptedBuffer);
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