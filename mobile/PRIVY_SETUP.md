# Privy Integration Setup

This document explains how to set up Privy authentication and wallet connection in your health app.

## Prerequisites

1. Create a Privy account at [privy.io](https://privy.io)
2. Create a new app in the Privy dashboard
3. Get your App ID from the dashboard

## Environment Configuration

1. Update your `.env` file with your Privy App ID:

```bash
# Flow blockchain address (already configured)
FLOW_ADDRESS="0x9e70bb43090ff282"

# Privy configuration
PRIVY_APP_ID="your_actual_privy_app_id_here"
```

2. Replace `"your_actual_privy_app_id_here"` with your actual Privy App ID from the dashboard.

## Privy Dashboard Configuration

In your Privy dashboard, configure the following:

### Login Methods
- ✅ Email
- ✅ Phone (SMS)
- ✅ Wallet connection
- ✅ Social logins (optional)

### Embedded Wallets
- ✅ Create on login: "Users without wallets"
- ✅ Auto-create for new users

### Allowed Origins
Add your development and production domains:
- `http://localhost:*` (for development)
- Your production domain

### Wallet Connect
If you want to support WalletConnect, you'll also need:
1. Create a project at [walletconnect.com](https://walletconnect.com)
2. Get your Project ID
3. Add it to the Privy configuration in `src/contexts/PrivyProvider.tsx`

## Features Implemented

### Authentication
- ✅ Email/Phone sign-in
- ✅ User profile management
- ✅ Session persistence

### Wallet Features
- ✅ Embedded wallet creation
- ✅ External wallet connection (MetaMask, WalletConnect, etc.)
- ✅ Multiple wallet linking
- ✅ Wallet export functionality
- ✅ Address display and management

### Integration
- ✅ React Native/Expo compatibility
- ✅ TypeScript support
- ✅ Error handling
- ✅ Loading states

## Usage

Once configured, users can:

1. **Sign In**: Use email, phone, or connect a wallet
2. **Embedded Wallet**: Automatically created for new users
3. **External Wallets**: Connect MetaMask, Coinbase, or other wallets
4. **Manage Wallets**: Link/unlink additional wallets
5. **Export**: Export embedded wallet private keys securely

## Testing

To test the integration:

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. Open the app and navigate to the Home screen

3. You should see:
   - Authentication status component
   - Wallet connection interface
   - Sign-in/sign-out functionality

## Troubleshooting

### Common Issues

1. **"Invalid App ID" error**
   - Verify your `PRIVY_APP_ID` in `.env`
   - Ensure the App ID matches your Privy dashboard

2. **"Origin not allowed" error**
   - Add your domain to allowed origins in Privy dashboard
   - Include `http://localhost:*` for development

3. **Wallet connection fails**
   - Ensure you have a stable internet connection
   - Check if the wallet app is installed (for mobile wallets)
   - Verify WalletConnect configuration if using WalletConnect

### Development Tips

- Check the console logs for detailed error messages
- Use the Privy dashboard analytics to monitor authentication events
- Test with different wallet types to ensure compatibility

## Security Notes

- Never commit your actual `PRIVY_APP_ID` to version control
- Use environment-specific configurations
- Always validate user permissions before sensitive operations
- Regularly rotate API keys and review access logs

## Next Steps

1. Configure your actual Privy App ID
2. Test the authentication flow
3. Customize the UI to match your app's design
4. Implement additional Privy features as needed
5. Deploy with proper environment configurations

For more information, visit the [Privy Documentation](https://docs.privy.io/).