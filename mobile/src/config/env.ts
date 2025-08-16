import Constants from 'expo-constants';

// Environment configuration for the app
export const ENV = {
  // Privy configuration
  PRIVY_APP_ID: Constants.expoConfig?.extra?.privyAppId || process.env.PRIVY_APP_ID || 'your_privy_app_id_here',
  
  // Flow blockchain configuration
  FLOW_ADDRESS: Constants.expoConfig?.extra?.flowAddress || process.env.FLOW_ADDRESS || '0x9e70bb43090ff282',
  FLOW_TESTNET_ACCESS_NODE: process.env.FLOW_TESTNET_ACCESS_NODE || 'https://rest-testnet.onflow.org',
  FLOW_TESTNET_DISCOVERY: process.env.FLOW_TESTNET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn',
  
  // Walrus configuration (updated 2025 endpoints)
  WALRUS_PUBLISHER_URL: process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_AGGREGATOR_URL: process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
  WALRUS_TESTNET_URL: process.env.WALRUS_TESTNET_URL || 'https://walrus-testnet.mystenlabs.com',
  
  // Development flags
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
};

// Validation
export function validateEnvConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ENV.PRIVY_APP_ID || ENV.PRIVY_APP_ID === 'your_privy_app_id_here') {
    errors.push('PRIVY_APP_ID is not configured. Please set up your Privy App ID in .env file.');
  }

  if (!ENV.FLOW_ADDRESS) {
    errors.push('FLOW_ADDRESS is not configured.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Log environment status (only in development)
if (__DEV__) {
  console.log('🔧 Environment Configuration:');
  console.log('  - Privy App ID:', ENV.PRIVY_APP_ID.startsWith('your_') ? '❌ Not configured' : '✅ Configured');
  console.log('  - Flow Address:', ENV.FLOW_ADDRESS ? '✅ Configured' : '❌ Not configured');
  console.log('  - Environment:', ENV.isDevelopment ? 'Development' : 'Production');
  
  const validation = validateEnvConfig();
  if (!validation.isValid) {
    console.warn('⚠️ Environment Configuration Issues:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
    console.warn('📖 See PRIVY_SETUP.md for configuration instructions');
  }
}