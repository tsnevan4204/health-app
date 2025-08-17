// Hedera SDK wrapper for React Native compatibility
// This handles the Node.js module issues in React Native

import { Platform } from 'react-native';

// Type definitions for the SDK functions we need
export interface HederaSDKInterface {
  Client: any;
  AccountId: any;
  PrivateKey: any;
  ContractCreateFlow: any;
  ContractExecuteTransaction: any;
  ContractCallQuery: any;
  FileCreateTransaction: any;
  Hbar: any;
}

let HederaSDK: HederaSDKInterface | null = null;

// Lazy load the SDK to avoid import errors on startup
export const getHederaSDK = async (): Promise<HederaSDKInterface> => {
  if (HederaSDK) {
    return HederaSDK;
  }

  try {
    // Try to import the SDK
    if (Platform.OS === 'web') {
      // Web platform - full SDK should work
      const sdk = await import('@hashgraph/sdk');
      HederaSDK = {
        Client: sdk.Client,
        AccountId: sdk.AccountId,
        PrivateKey: sdk.PrivateKey,
        ContractCreateFlow: sdk.ContractCreateFlow,
        ContractExecuteTransaction: sdk.ContractExecuteTransaction,
        ContractCallQuery: sdk.ContractCallQuery,
        FileCreateTransaction: sdk.FileCreateTransaction,
        Hbar: sdk.Hbar,
      };
    } else {
      // Mobile platform - SDK might have issues, use polyfilled version
      const sdk = await import('@hashgraph/sdk');
      HederaSDK = {
        Client: sdk.Client,
        AccountId: sdk.AccountId,
        PrivateKey: sdk.PrivateKey,
        ContractCreateFlow: sdk.ContractCreateFlow,
        ContractExecuteTransaction: sdk.ContractExecuteTransaction,
        ContractCallQuery: sdk.ContractCallQuery,
        FileCreateTransaction: sdk.FileCreateTransaction,
        Hbar: sdk.Hbar,
      };
    }
    
    console.log('✅ Hedera SDK loaded successfully');
    return HederaSDK;
  } catch (error) {
    console.error('❌ Failed to load Hedera SDK:', error);
    throw new Error(`Hedera SDK not available: ${error}`);
  }
};

// Check if SDK is available
export const isSDKAvailable = async (): Promise<boolean> => {
  try {
    await getHederaSDK();
    return true;
  } catch {
    return false;
  }
};