// Hedera Testnet Configuration
// To get a funded testnet account:
// 1. Go to https://portal.hedera.com/
// 2. Create an account and sign in
// 3. Go to "Testnet" section
// 4. Create a new testnet account (it will be auto-funded with test HBAR)
// 5. Copy your Account ID and Private Key (DER encoded)
// 6. Add them below

export const HEDERA_TESTNET_CREDENTIALS = {
  // IMPORTANT: Replace these with your actual testnet credentials
  // Format: '0.0.1234567'
  ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID || '0.0.6566992', // Your testnet account ID
  
  // Format: '302e020100300506032b6570042204...' (DER encoded private key)
  // Or: '0x...' (hex format)
  PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY || '0x0b31261b447e9ea6288c3db9544168dc851ec2b68bddecc62e67673bf5f784f4', // Your testnet private key
  
  // Your EVM address associated with this account
  EVM_ADDRESS: '0x5d3de7f761451cbcbab2d95e8eca3a833d0927c4',
  
  // Network configuration
  NETWORK: 'testnet',
  
  // Optional: Set max transaction fee (in HBAR)
  MAX_TRANSACTION_FEE: 100,
  
  // Optional: Token ID if you've already created one
  EXISTING_TOKEN_ID: process.env.HEDERA_TOKEN_ID || null,
};

// Instructions to get funded testnet account:
/*
1. Visit https://portal.hedera.com/register
2. Create a free account
3. After login, go to the Testnet section
4. Click "Create Testnet Account"
5. Your account will be created with:
   - Account ID (e.g., 0.0.4123456)
   - Private Key (keep this secret!)
   - 10,000 test HBAR automatically

6. Copy your credentials and paste them above

SECURITY NOTES:
- Never commit real mainnet credentials to code
- For production, use environment variables or secure key management
- Testnet HBAR has no real value, safe for testing
*/