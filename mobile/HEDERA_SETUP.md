# 🔷 Hedera Testnet Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Free Testnet Account

1. **Visit Hedera Portal**: https://portal.hedera.com/register
2. **Create Account**: Sign up with email (it's free)
3. **Go to Testnet Section**: After login, click on "Testnet" in the dashboard
4. **Create Testnet Account**: Click "Create Testnet Account"
   - You'll automatically get **10,000 test HBAR** (free testnet tokens)
   - Save your **Account ID** (format: `0.0.1234567`)
   - Save your **Private Key** (keep this secret!)

### Step 2: Add Credentials to Your App

1. Open `src/config/hedera.config.ts`
2. Replace the placeholder values:

```typescript
export const HEDERA_TESTNET_CREDENTIALS = {
  // Replace with your actual testnet account ID from Step 1
  ACCOUNT_ID: '0.0.6566992',
  
  // Replace with your testnet private key from Step 1
  PRIVATE_KEY: '0x0b31261b447e9ea6288c3db9544168dc851ec2b68bddecc62e67673bf5f784f4',
  EVM_ADDRESS: '0x5d3de7f761451cbcbab2d95e8eca3a833d0927c4',
  
  // Keep other settings as is
  NETWORK: 'testnet',
  MAX_TRANSACTION_FEE: 100,
};
```

### Step 3: Test Your Connection

1. Restart your app: `npx expo start --clear`
2. When you submit data to a bounty, you'll see:
   - `🎉 REAL TRANSACTION SUBMITTED TO HEDERA TESTNET!`
   - A real transaction ID that works on HashScan
   - Your actual account balance

## What Happens When Connected?

✅ **Real Transactions**: Your health data submissions create real blockchain transactions
✅ **HashScan Links Work**: Transaction IDs link to actual explorer pages
✅ **HCS Messages**: Metadata stored on Hedera Consensus Service
✅ **Free Testing**: Testnet HBAR has no real value - test as much as you want!

## Transaction Types

The app uses **Hedera Consensus Service (HCS)** for storing NFT metadata:
- Creates a topic for health data
- Each submission sends a message to the topic
- Messages are immutable and timestamped
- Perfect for health data provenance

## Verify Your Transactions

After submitting data:
1. Copy the transaction link
2. Visit HashScan: https://hashscan.io/testnet
3. Search for your transaction ID
4. You'll see the real blockchain record!

## Troubleshooting

### "Transaction failed" Error
- Check your account has HBAR balance
- Verify credentials are correct in config file
- Make sure you're using testnet (not mainnet) credentials

### "Invalid credentials format"
- Private key should start with `302e...` (DER format) or `0x...` (hex)
- Account ID format: `0.0.1234567` (three parts separated by dots)

### Need More Test HBAR?
- Testnet accounts start with 10,000 HBAR
- If you run out, create a new testnet account (it's free)
- Or use the Hedera faucet for refills

## Security Notes

⚠️ **NEVER** share your mainnet private keys
✅ **Testnet keys** are safe to use for testing
🔐 For production, use secure key management services

## Next Steps

1. ✅ Connect funded account
2. ✅ Submit real transactions
3. 🔍 View on HashScan explorer
4. 🎯 Test bounty submissions
5. 🚀 Ready for mainnet (when you want real value)

## Links

- **Get Account**: https://portal.hedera.com/
- **Explorer**: https://hashscan.io/testnet
- **Documentation**: https://docs.hedera.com/
- **Faucet**: https://portal.hedera.com/faucet