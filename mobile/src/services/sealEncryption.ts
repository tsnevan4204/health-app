import AsyncStorage from '@react-native-async-storage/async-storage';
import { dynamicWalletService } from './dynamicWallet';
import * as Crypto from 'expo-crypto';

// SEAL encryption configuration
const SEAL_CONFIG = {
  polyModulusDegree: 4096,
  coeffModulus: [46, 16, 46],
  plainModulus: 256,
  scheme: 'BFV' as const,
};

// Storage keys for SEAL keys
const STORAGE_KEYS = {
  SEAL_PUBLIC_KEY: '@seal_public_key',
  SEAL_SECRET_KEY: '@seal_secret_key', // Encrypted with Dynamic wallet key
  SEAL_RELIN_KEYS: '@seal_relin_keys',
  SEAL_GALOIS_KEYS: '@seal_galois_keys',
};

export interface SEALKeys {
  publicKey: string;
  secretKey: string; // Encrypted with user's private key
  relinKeys?: string;
  galoisKeys?: string;
}

export interface EncryptedHealthMetric {
  encryptedValue: string; // SEAL encrypted value
  metricType: string;
  timestamp: string;
  canCompute: boolean; // Whether computations can be performed
}

class SEALEncryptionService {
  private initialized = false;
  private publicKey: string | null = null;
  private secretKeyEncrypted: string | null = null;

  /**
   * Initialize SEAL encryption with user's Dynamic wallet
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing SEAL encryption service...');
      
      // Check if keys already exist
      const storedPublicKey = await AsyncStorage.getItem(STORAGE_KEYS.SEAL_PUBLIC_KEY);
      const storedSecretKey = await AsyncStorage.getItem(STORAGE_KEYS.SEAL_SECRET_KEY);
      
      if (storedPublicKey && storedSecretKey) {
        this.publicKey = storedPublicKey;
        this.secretKeyEncrypted = storedSecretKey;
        this.initialized = true;
        console.log('✅ SEAL keys loaded from storage');
        return;
      }
      
      // Generate new SEAL keys
      await this.generateKeys();
      
      this.initialized = true;
      console.log('✅ SEAL encryption initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SEAL encryption:', error);
      throw error;
    }
  }

  /**
   * Generate SEAL encryption keys
   */
  private async generateKeys(): Promise<SEALKeys> {
    try {
      console.log('🔑 Generating SEAL encryption keys...');
      
      // In production, use actual SEAL library
      // For demo, generate mock keys
      const publicKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `seal_public_${Date.now()}_${Math.random()}`
      );
      
      const secretKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `seal_secret_${Date.now()}_${Math.random()}`
      );
      
      // Encrypt secret key with user's Dynamic wallet private key
      const walletPrivateKey = await dynamicWalletService.getEncryptedPrivateKey();
      const encryptedSecretKey = await this.encryptWithWalletKey(secretKey, walletPrivateKey);
      
      // Store keys
      await AsyncStorage.setItem(STORAGE_KEYS.SEAL_PUBLIC_KEY, publicKey);
      await AsyncStorage.setItem(STORAGE_KEYS.SEAL_SECRET_KEY, encryptedSecretKey);
      
      this.publicKey = publicKey;
      this.secretKeyEncrypted = encryptedSecretKey;
      
      return {
        publicKey,
        secretKey: encryptedSecretKey,
      };
    } catch (error) {
      console.error('❌ Failed to generate SEAL keys:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using SEAL homomorphic encryption
   */
  async encryptHealthData(data: any): Promise<EncryptedHealthMetric> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      console.log('🔒 Encrypting health data with SEAL...');
      
      // In production, use actual SEAL encryption
      // For demo, simulate homomorphic encryption
      const encryptedValue = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `seal_encrypted_${JSON.stringify(data)}_${this.publicKey}`
      );
      
      return {
        encryptedValue,
        metricType: data.type || 'unknown',
        timestamp: new Date().toISOString(),
        canCompute: true, // SEAL allows computations on encrypted data
      };
    } catch (error) {
      console.error('❌ Failed to encrypt with SEAL:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using SEAL (requires secret key)
   */
  async decryptHealthData(encryptedData: EncryptedHealthMetric): Promise<any> {
    if (!this.initialized || !this.secretKeyEncrypted) {
      throw new Error('SEAL encryption not initialized or no secret key');
    }
    
    try {
      console.log('🔓 Decrypting health data with SEAL...');
      
      // Get wallet private key to decrypt SEAL secret key
      const walletPrivateKey = await dynamicWalletService.getEncryptedPrivateKey();
      const secretKey = await this.decryptWithWalletKey(this.secretKeyEncrypted, walletPrivateKey);
      
      // In production, use actual SEAL decryption
      // For demo, return mock decrypted data
      return {
        value: Math.random() * 100,
        type: encryptedData.metricType,
        timestamp: encryptedData.timestamp,
        decrypted: true,
      };
    } catch (error) {
      console.error('❌ Failed to decrypt with SEAL:', error);
      throw error;
    }
  }

  /**
   * Perform homomorphic addition on encrypted values
   */
  async addEncrypted(encrypted1: string, encrypted2: string): Promise<string> {
    try {
      console.log('➕ Performing homomorphic addition...');
      
      // In production, use actual SEAL homomorphic operations
      // For demo, return mock result
      const result = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `seal_add_${encrypted1}_${encrypted2}`
      );
      
      return result;
    } catch (error) {
      console.error('❌ Failed to perform homomorphic addition:', error);
      throw error;
    }
  }

  /**
   * Perform homomorphic multiplication on encrypted values
   */
  async multiplyEncrypted(encrypted: string, scalar: number): Promise<string> {
    try {
      console.log('✖️ Performing homomorphic multiplication...');
      
      // In production, use actual SEAL homomorphic operations
      // For demo, return mock result
      const result = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `seal_multiply_${encrypted}_${scalar}`
      );
      
      return result;
    } catch (error) {
      console.error('❌ Failed to perform homomorphic multiplication:', error);
      throw error;
    }
  }

  /**
   * Compute average on encrypted values without decryption
   */
  async computeEncryptedAverage(encryptedValues: string[]): Promise<string> {
    try {
      console.log('📊 Computing average on encrypted data...');
      
      // Sum all encrypted values
      let sum = encryptedValues[0];
      for (let i = 1; i < encryptedValues.length; i++) {
        sum = await this.addEncrypted(sum, encryptedValues[i]);
      }
      
      // Divide by count (multiply by 1/n)
      const average = await this.multiplyEncrypted(sum, 1 / encryptedValues.length);
      
      return average;
    } catch (error) {
      console.error('❌ Failed to compute encrypted average:', error);
      throw error;
    }
  }

  /**
   * Encrypt with wallet key (helper function)
   */
  private async encryptWithWalletKey(data: string, walletKey: string): Promise<string> {
    // In production, use proper encryption with wallet key
    // For demo, simple XOR-like operation
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${data}_encrypted_with_${walletKey}`
    );
    return encrypted;
  }

  /**
   * Decrypt with wallet key (helper function)
   */
  private async decryptWithWalletKey(encryptedData: string, walletKey: string): Promise<string> {
    // In production, use proper decryption with wallet key
    // For demo, return mock decrypted data
    return `decrypted_${encryptedData.substring(0, 10)}`;
  }

  /**
   * Clear all SEAL keys (for logout)
   */
  async clearKeys(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SEAL_PUBLIC_KEY,
        STORAGE_KEYS.SEAL_SECRET_KEY,
        STORAGE_KEYS.SEAL_RELIN_KEYS,
        STORAGE_KEYS.SEAL_GALOIS_KEYS,
      ]);
      
      this.publicKey = null;
      this.secretKeyEncrypted = null;
      this.initialized = false;
      
      console.log('✅ SEAL keys cleared');
    } catch (error) {
      console.error('❌ Failed to clear SEAL keys:', error);
      throw error;
    }
  }

  /**
   * Export public key for sharing
   */
  async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      throw new Error('SEAL encryption not initialized');
    }
    return this.publicKey;
  }
}

// Export singleton instance
export const sealEncryption = new SEALEncryptionService();

// Helper function to check if data can be computed on
export const canPerformHomomorphicComputation = (data: EncryptedHealthMetric): boolean => {
  return data.canCompute === true;
};

// Helper function to prepare data for SEAL encryption
export const prepareHealthDataForSEAL = (healthData: any): any => {
  // Convert health metrics to numeric values for SEAL
  const numericData: any = {};
  
  if (healthData.heartRate) {
    numericData.heartRate = parseFloat(healthData.heartRate);
  }
  
  if (healthData.steps) {
    numericData.steps = parseInt(healthData.steps);
  }
  
  if (healthData.calories) {
    numericData.calories = parseFloat(healthData.calories);
  }
  
  if (healthData.sleep) {
    numericData.sleepHours = parseFloat(healthData.sleep.duration);
  }
  
  return numericData;
};