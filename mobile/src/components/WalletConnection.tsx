import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { usePrivyAuth } from '../hooks/usePrivyAuth';

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
}

export default function WalletConnection({ onWalletConnected }: WalletConnectionProps) {
  const {
    isAuthenticated,
    userWallets,
    embeddedWallet,
    connectedWallets,
    connectExternalWallet,
    linkExternalWallet,
    unlinkExternalWallet,
    exportEmbeddedWallet,
  } = usePrivyAuth();

  const [loading, setLoading] = useState(false);

  const handleConnectWallet = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in first to connect a wallet.');
      return;
    }

    try {
      setLoading(true);
      await connectExternalWallet();
      Alert.alert('Success', 'Wallet connected successfully!');
      
      if (onWalletConnected && connectedWallets.length > 0) {
        onWalletConnected(connectedWallets[0].address);
      }
    } catch (error) {
      console.error('Connect wallet error:', error);
      Alert.alert('Connection Error', 'Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in first to link a wallet.');
      return;
    }

    try {
      setLoading(true);
      await linkExternalWallet();
      Alert.alert('Success', 'Additional wallet linked successfully!');
    } catch (error) {
      console.error('Link wallet error:', error);
      Alert.alert('Link Error', 'Failed to link additional wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkWallet = async (walletAddress: string) => {
    Alert.alert(
      'Unlink Wallet',
      `Are you sure you want to unlink the wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await unlinkExternalWallet(walletAddress);
              Alert.alert('Success', 'Wallet unlinked successfully!');
            } catch (error) {
              console.error('Unlink wallet error:', error);
              Alert.alert('Unlink Error', 'Failed to unlink wallet. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportWallet = async () => {
    if (!embeddedWallet) {
      Alert.alert('No Embedded Wallet', 'No embedded wallet found to export.');
      return;
    }

    Alert.alert(
      'Export Embedded Wallet',
      'This will allow you to export your embedded wallet private key. Make sure you are in a secure environment.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              setLoading(true);
              await exportEmbeddedWallet();
            } catch (error) {
              console.error('Export wallet error:', error);
              Alert.alert('Export Error', 'Failed to export wallet. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatWalletAddress = (address: string | undefined) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWalletTypeDisplay = (walletClientType: string) => {
    switch (walletClientType) {
      case 'privy':
        return '🔐 Embedded Wallet';
      case 'metamask':
        return '🦊 MetaMask';
      case 'wallet_connect':
        return '🔗 WalletConnect';
      case 'coinbase_wallet':
        return '💙 Coinbase Wallet';
      default:
        return `🔗 ${walletClientType}`;
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthenticatedContainer}>
        <Text style={styles.unauthenticatedText}>
          🔐 Sign in to access wallet features
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Wallet Connection</Text>
        <Text style={styles.subtitle}>
          Connect external wallets or use your secure embedded wallet
        </Text>
      </View>

      {/* Embedded Wallet Section */}
      {embeddedWallet && (
        <View style={styles.walletSection}>
          <Text style={styles.sectionTitle}>Embedded Wallet</Text>
          <View style={styles.walletItem}>
            <View style={styles.walletInfo}>
              <Text style={styles.walletType}>
                {getWalletTypeDisplay(embeddedWallet.walletClientType)}
              </Text>
              <Text style={styles.walletAddress}>
                {formatWalletAddress(embeddedWallet.address)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportWallet}
              disabled={loading}
            >
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Connected Wallets Section */}
      {connectedWallets.length > 0 && (
        <View style={styles.walletSection}>
          <Text style={styles.sectionTitle}>Connected Wallets</Text>
          <ScrollView style={styles.walletsList}>
            {connectedWallets.map((wallet: any, index: number) => (
              <View key={index} style={styles.walletItem}>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletType}>
                    {getWalletTypeDisplay(wallet.walletClientType)}
                  </Text>
                  <Text style={styles.walletAddress}>
                    {formatWalletAddress(wallet.address)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.unlinkButton}
                  onPress={() => handleUnlinkWallet(wallet.address)}
                  disabled={loading}
                >
                  <Text style={styles.unlinkButtonText}>Unlink</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {userWallets.length === 0 ? (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectWallet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.connectButtonText}>🔗 Connect Your First Wallet</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleLinkWallet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.linkButtonText}>+ Link Additional Wallet</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Wallet Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          📊 Total Wallets: {userWallets.length}
          {embeddedWallet && ' (1 Embedded)'}
          {connectedWallets.length > 0 && ` (${connectedWallets.length} External)`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unauthenticatedContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  unauthenticatedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  walletSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  walletsList: {
    maxHeight: 200,
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  walletInfo: {
    flex: 1,
  },
  walletType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  exportButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  unlinkButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unlinkButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  summaryText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
});