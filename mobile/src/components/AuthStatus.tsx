import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { usePrivyAuth } from '../hooks/usePrivyAuth';

export default function AuthStatus() {
  const { 
    isLoading, 
    isAuthenticated, 
    user, 
    userWallets,
    embeddedWallet,
    connectedWallets,
    signIn, 
    signOut,
    connectExternalWallet 
  } = usePrivyAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Sign In Error', 'Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Sign Out Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectExternalWallet();
    } catch (error) {
      console.error('Connect wallet error:', error);
      Alert.alert('Connect Wallet Error', 'Failed to connect wallet. Please try again.');
    }
  };

  const showUserInfo = () => {
    if (!user) return;

    const walletInfo = userWallets.length > 0 
      ? `\n\nWallets:\n${userWallets.map((w: any) => `• ${w.address?.slice(0, 6)}...${w.address?.slice(-4)} (${w.walletClientType})`).join('\n')}`
      : '\n\nNo wallets connected';

    Alert.alert(
      'User Profile',
      `Email: ${(user as any)?.email?.address || 'Not provided'}\n` +
      `Phone: ${(user as any)?.phone?.number || 'Not provided'}\n` +
      `User ID: ${user?.id}\n` +
      `${walletInfo}`,
      [
        { text: 'Connect Wallet', onPress: handleConnectWallet },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading authentication...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthenticatedContainer}>
        <View style={styles.authHeader}>
          <Text style={styles.authTitle}>🔐 Sign In Required</Text>
          <Text style={styles.authSubtitle}>Sign in to access wallet features and secure data storage</Text>
        </View>
        
        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleSignIn}
        >
          <Text style={styles.signInButtonText}>Sign In with Privy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.authenticatedContainer}>
      <View style={styles.userInfoContainer}>
        <TouchableOpacity 
          style={styles.userInfoButton}
          onPress={showUserInfo}
        >
          <View style={styles.userInfoMain}>
            <Text style={styles.userEmail}>
              {(user as any)?.email?.address || (user as any)?.phone?.number || 'Authenticated User'}
            </Text>
            <Text style={styles.walletStatus}>
              {embeddedWallet ? '🟢 Embedded Wallet' : '🟡 No Embedded Wallet'}
              {connectedWallets.length > 0 && ` • ${connectedWallets.length} External Wallet${connectedWallets.length > 1 ? 's' : ''}`}
            </Text>
          </View>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  unauthenticatedContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  authHeader: {
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authenticatedContainer: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  userInfoContainer: {
    marginBottom: 12,
  },
  userInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoMain: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 4,
  },
  walletStatus: {
    fontSize: 12,
    color: '#155724',
    opacity: 0.8,
  },
  infoIcon: {
    fontSize: 18,
    color: '#155724',
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: '#6c757d',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});