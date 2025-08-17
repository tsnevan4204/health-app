import { DynamicContextProvider, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum-aa';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';

// Storage keys for wallet data
const STORAGE_KEYS = {
  WALLET_ADDRESS: '@dynamic_wallet_address',
  PHONE_NUMBER: '@dynamic_phone_number',
  PRIVATE_KEY_ENCRYPTED: '@dynamic_private_key_encrypted',
  AUTH_TOKEN: '@dynamic_auth_token',
};

// Dynamic configuration
export const DYNAMIC_CONFIG = {
  environmentId: process.env.DYNAMIC_ENVIRONMENT_ID || 'YOUR_DYNAMIC_ENV_ID',
  walletConnectors: [EthereumWalletConnectors],
  settings: {
    appName: 'Health Data Marketplace',
    appLogoUrl: 'https://your-app-logo.png',
    socialProvidersFilter: {
      google: true,
      apple: true,
    },
    // SMS authentication enabled
    enableSmsAuthentication: true,
    // Email authentication as backup
    enableEmailAuthentication: true,
    // Embedded wallet configuration
    embeddedWallets: {
      enabled: true,
      requireUserPassword: false, // Use SMS for auth
      showWalletDropdown: false,
    },
    // Privacy settings
    privacyPolicyUrl: 'https://your-privacy-policy.com',
    termsOfServiceUrl: 'https://your-terms.com',
  },
};

export interface DynamicWalletService {
  // Initialize wallet with SMS authentication
  initializeWithSMS(phoneNumber: string): Promise<{
    walletAddress: string;
    privateKeyEncrypted: string;
  }>;
  
  // Verify SMS code
  verifySMSCode(code: string): Promise<boolean>;
  
  // Get wallet instance
  getWallet(): Promise<any>;
  
  // Sign message with private key
  signMessage(message: string): Promise<string>;
  
  // Get encrypted private key
  getEncryptedPrivateKey(): Promise<string>;
  
  // Clear wallet data
  clearWalletData(): Promise<void>;
}

class DynamicWalletServiceImpl implements DynamicWalletService {
  private walletClient: any = null;
  
  async initializeWithSMS(phoneNumber: string): Promise<{
    walletAddress: string;
    privateKeyEncrypted: string;
  }> {
    try {
      // Store phone number for reference
      await AsyncStorage.setItem(STORAGE_KEYS.PHONE_NUMBER, phoneNumber);
      
      // In production, this would trigger SMS verification through Dynamic
      // For now, we'll simulate the flow
      console.log(`Sending SMS verification to ${phoneNumber}`);
      
      // Simulate wallet creation after SMS verification
      // In production, Dynamic handles this
      const mockWalletAddress = '0x' + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      const mockPrivateKeyEncrypted = 'encrypted_' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      // Store wallet data
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, mockWalletAddress);
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVATE_KEY_ENCRYPTED, mockPrivateKeyEncrypted);
      
      return {
        walletAddress: mockWalletAddress,
        privateKeyEncrypted: mockPrivateKeyEncrypted,
      };
    } catch (error) {
      console.error('Failed to initialize wallet with SMS:', error);
      throw error;
    }
  }
  
  async verifySMSCode(code: string): Promise<boolean> {
    try {
      // In production, verify with Dynamic API
      // For demo, accept any 6-digit code
      if (code.length === 6 && /^\d+$/.test(code)) {
        // Create auth token
        const authToken = 'auth_' + Date.now();
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to verify SMS code:', error);
      return false;
    }
  }
  
  async getWallet(): Promise<any> {
    try {
      if (this.walletClient) {
        return this.walletClient;
      }
      
      const walletAddress = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
      if (!walletAddress) {
        throw new Error('No wallet found. Please initialize first.');
      }
      
      // In production, use Dynamic's wallet provider
      // For now, create a basic wallet client
      this.walletClient = createWalletClient({
        chain: mainnet,
        transport: custom({
          request: async ({ method, params }) => {
            console.log('Wallet request:', method, params);
            // Handle wallet requests
            return null;
          },
        }),
      });
      
      return this.walletClient;
    } catch (error) {
      console.error('Failed to get wallet:', error);
      throw error;
    }
  }
  
  async signMessage(message: string): Promise<string> {
    try {
      const privateKeyEncrypted = await AsyncStorage.getItem(STORAGE_KEYS.PRIVATE_KEY_ENCRYPTED);
      if (!privateKeyEncrypted) {
        throw new Error('No private key found');
      }
      
      // In production, decrypt and sign with actual private key
      // For demo, return mock signature
      const mockSignature = '0x' + Array(130).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      return mockSignature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }
  
  async getEncryptedPrivateKey(): Promise<string> {
    const key = await AsyncStorage.getItem(STORAGE_KEYS.PRIVATE_KEY_ENCRYPTED);
    if (!key) {
      throw new Error('No encrypted private key found');
    }
    return key;
  }
  
  async clearWalletData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.WALLET_ADDRESS,
        STORAGE_KEYS.PHONE_NUMBER,
        STORAGE_KEYS.PRIVATE_KEY_ENCRYPTED,
        STORAGE_KEYS.AUTH_TOKEN,
      ]);
      this.walletClient = null;
    } catch (error) {
      console.error('Failed to clear wallet data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dynamicWalletService = new DynamicWalletServiceImpl();

// Hook for using Dynamic context in components
export const useDynamicWallet = () => {
  const context = useDynamicContext();
  return {
    ...context,
    walletService: dynamicWalletService,
  };
};