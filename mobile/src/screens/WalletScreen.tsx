import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletScreen() {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      // Load wallet address from storage or generate one
      const storedAddress = await AsyncStorage.getItem('@fitcentive_wallet_address');
      if (storedAddress) {
        setWalletAddress(storedAddress);
      } else {
        // Generate a mock Hedera address
        const newAddress = `0.0.${Math.floor(Math.random() * 1000000)}`;
        setWalletAddress(newAddress);
        await AsyncStorage.setItem('@fitcentive_wallet_address', newAddress);
      }

      // Load balance and transactions from storage
      const storedBalance = await AsyncStorage.getItem('@fitcentive_wallet_balance');
      setBalance(storedBalance ? parseFloat(storedBalance) : 100.0);

      // Load transactions from storage
      const storedTransactions = await AsyncStorage.getItem('@fitcentive_wallet_transactions');
      if (storedTransactions) {
        const transactions = JSON.parse(storedTransactions).map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp)
        }));
        setTransactions(transactions);
      } else {
        // Default transactions if none exist
        const defaultTransactions = [
          {
            id: '1',
            type: 'received',
            amount: 25.0,
            from: 'Test Faucet',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            description: 'Initial test HBAR allocation'
          }
        ];
        setTransactions(defaultTransactions);
        await AsyncStorage.setItem('@fitcentive_wallet_transactions', JSON.stringify(defaultTransactions.map(tx => ({
          ...tx,
          timestamp: tx.timestamp.toISOString()
        }))));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const connectMetaMaskSnap = async () => {
    try {
      setLoading(true);
      
      // Simulate MetaMask Snap connection
      Alert.alert(
        'MetaMask Snap Integration',
        'MetaMask Snap would be integrated here for full wallet functionality. For demo purposes, we are using a simulated wallet with test HBAR.',
        [
          { text: 'OK' }
        ]
      );
      
    } catch (error) {
      console.error('Error connecting MetaMask Snap:', error);
      Alert.alert('Error', 'Failed to connect MetaMask Snap');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const viewHederaTransaction = (transaction: any) => {
    if (transaction.hederaTransactionId) {
      const hashscanUrl = `https://hashscan.io/testnet/transaction/${transaction.hederaTransactionId}`;
      console.log(`🔗 Opening HashScan for transaction: ${transaction.hederaTransactionId}`);
      
      Linking.canOpenURL(hashscanUrl).then(supported => {
        if (supported) {
          Linking.openURL(hashscanUrl);
        } else {
          Alert.alert(
            'Hedera Transaction Details',
            `Transaction ${transaction.hederaTransactionId} for ${transaction.amount} HBAR from ${transaction.from}. ${transaction.nftTokenId ? `NFT Token: ${transaction.nftTokenId}` : ''}`,
            [{ text: 'OK' }]
          );
        }
      });
    } else {
      Alert.alert(
        'Transaction Details',
        `Test transaction for ${transaction.amount} HBAR from ${transaction.from}. This transaction is not recorded on blockchain.`,
        [{ text: 'OK' }]
      );
    }
  };

  const viewWalrusData = (transaction: any) => {
    if (transaction.walrusBlobId) {
      const walruscanUrl = `https://walruscan.com/testnet/blob/${transaction.walrusBlobId}`;
      console.log(`🔗 Opening Walruscan for blob: ${transaction.walrusBlobId}`);
      
      Linking.canOpenURL(walruscanUrl).then(supported => {
        if (supported) {
          Linking.openURL(walruscanUrl);
        } else {
          Alert.alert(
            'Walrus Data Explorer',
            `View submitted health data on Walrus blockchain at walruscan.com. Copy this URL: ${walruscanUrl}`,
            [{ text: 'OK' }]
          );
        }
      });
    } else {
      Alert.alert(
        'No Data Available',
        'This transaction does not have associated Walrus data.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Manage your test HBAR and NFT rewards</Text>
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Test HBAR Balance</Text>
          <Text style={styles.balanceValue}>{balance.toFixed(2)} HBAR</Text>
          
          {walletAddress && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Wallet Address:</Text>
              <Text style={styles.addressValue}>{formatAddress(walletAddress)}</Text>
            </View>
          )}
        </View>

        {/* MetaMask Snap Integration */}
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={connectMetaMaskSnap}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.connectButtonText}>🦊 Connect MetaMask Snap</Text>
              <Text style={styles.connectButtonSubtext}>Full wallet functionality</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {tx.type === 'received' ? '📥 Received' : '📤 Sent'}
                  </Text>
                  <Text style={styles.transactionAmount}>
                    {tx.type === 'received' ? '+' : '-'}{tx.amount} HBAR
                  </Text>
                </View>
                <Text style={styles.transactionTime}>{formatTimestamp(tx.timestamp)}</Text>
              </View>
              
              <Text style={styles.transactionDescription}>{tx.description}</Text>
              <Text style={styles.transactionFrom}>From: {tx.from}</Text>
              
              {/* Transaction details and viewing buttons */}
              {(tx.hederaTransactionId || tx.nftTokenId || tx.walrusBlobId) && (
                <View style={styles.transactionDetails}>
                  {tx.hederaTransactionId && (
                    <Text style={styles.transactionId}>
                      🔗 Transaction: {tx.hederaTransactionId.substring(0, 20)}...
                    </Text>
                  )}
                  {tx.nftTokenId && (
                    <Text style={styles.transactionId}>
                      🎨 NFT Token: {tx.nftTokenId}
                    </Text>
                  )}
                  {tx.walrusBlobId && (
                    <Text style={styles.transactionId}>
                      📦 Data Blob: {tx.walrusBlobId.substring(0, 12)}...
                    </Text>
                  )}
                  
                  <View style={styles.viewButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => viewHederaTransaction(tx)}
                    >
                      <Text style={styles.viewButtonText}>
                        {tx.hederaTransactionId ? '🔗 View on Hedera' : '📊 View Details'}
                      </Text>
                    </TouchableOpacity>
                    
                    {tx.walrusBlobId && (
                      <TouchableOpacity 
                        style={[styles.viewButton, styles.walrusButton]}
                        onPress={() => viewWalrusData(tx)}
                      >
                        <Text style={[styles.viewButtonText, styles.walrusButtonText]}>
                          🐋 View Data
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Wallet Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Features</Text>
          
          <View style={styles.featureGrid}>
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>💱</Text>
              <Text style={styles.featureTitle}>Send HBAR</Text>
              <Text style={styles.featureSubtitle}>Transfer to other wallets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureTitle}>My NFTs</Text>
              <Text style={styles.featureSubtitle}>View health data NFTs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Analytics</Text>
              <Text style={styles.featureSubtitle}>Earnings & activity</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>⚙️</Text>
              <Text style={styles.featureTitle}>Settings</Text>
              <Text style={styles.featureSubtitle}>Wallet preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  addressContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'monospace',
  },
  connectButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  connectButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  transactionTime: {
    fontSize: 12,
    color: '#666',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionFrom: {
    fontSize: 12,
    color: '#999',
  },
  transactionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  transactionId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  viewButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  walrusButton: {
    backgroundColor: '#28a745',
  },
  walrusButtonText: {
    color: 'white',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});