// EXAMPLE Hedera Testnet Configuration - SAFE TO COMMIT
// Copy this file to hedera.config.ts and add your actual credentials
// hedera.config.ts is gitignored and will not be committed

// To get a funded testnet account:
// 1. Go to https://portal.hedera.com/
// 2. Create an account and sign in
// 3. Go to "Testnet" section
// 4. Create a new testnet account (it will be auto-funded with test HBAR)
// 5. Copy your Account ID and Private Key
// 6. Create hedera.config.ts from this template and add your credentials

export const HEDERA_TESTNET_CREDENTIALS = {
  // Replace with your actual testnet account ID
  // Format: '0.0.1234567'
  ACCOUNT_ID: '0.0.REPLACE_WITH_YOUR_ACCOUNT',
  
  // Replace with your testnet private key
  // Format: '302e020100300506032b6570042204...' (DER encoded)
  // Or: '0x...' (hex format)
  PRIVATE_KEY: 'REPLACE_WITH_YOUR_PRIVATE_KEY',
  
  // Optional: Your EVM address if you have one
  EVM_ADDRESS: '',
  
  // Network configuration
  NETWORK: 'testnet',
  
  // Optional: Set max transaction fee (in HBAR)
  MAX_TRANSACTION_FEE: 100,
  
  // Optional: Token ID if you've already created one
  EXISTING_TOKEN_ID: null,
};

// SECURITY WARNINGS:
// ⚠️ NEVER commit real credentials to git
// ⚠️ NEVER share your mainnet private keys
// ✅ Testnet credentials are safe for testing only
// ✅ Always use environment variables in production
// 🔐 For production, use secure key management services (AWS KMS, HashiCorp Vault, etc.)