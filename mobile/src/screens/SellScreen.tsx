import React, { useState } from 'react';
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
import HederaBlockchainService from '../services/hederaBlockchain';
import HealthNFTService, { HealthBountyNFT } from '../services/healthNFTService';
import WalrusService from '../services/walrus';

// Helper function to map display metric names to actual data keys
const mapMetricToDataKey = (metric: string): string => {
  const mappings: { [key: string]: string } = {
    'HRV': 'hrv',
    'Heart Rate Variability': 'hrv',
    'Stress Level': 'stress',
    'Sleep Quality': 'sleep',
    'Exercise Minutes': 'exercise',
    'Heart Rate Recovery': 'hr_recovery',
    'RHR': 'rhr',
    'Resting Heart Rate': 'rhr',
    'Weight': 'weight',
    'Exercise': 'exercise',
    'Biological Age': 'biologicalAge',
    'Exercise Performance': 'exercise_performance'
  };
  
  return mappings[metric] || metric.toLowerCase();
};

export default function SellScreen() {
  const [healthBounties, setHealthBounties] = useState<HealthBountyNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBountyId, setLoadingBountyId] = useState<string | null>(null);
  
  // Load health bounties on component mount
  React.useEffect(() => {
    const loadBounties = () => {
      try {
        const bounties = HealthNFTService.getPredefinedHealthBounties();
        setHealthBounties(bounties);
        console.log(`📋 Loaded ${bounties.length} health bounties`);
      } catch (error) {
        console.error('❌ Failed to load health bounties:', error);
      }
    };
    
    loadBounties();
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return '#6c757d';
      case 'Rare': return '#17a2b8';
      case 'Epic': return '#6f42c1';
      case 'Legendary': return '#fd7e14';
      default: return '#6c757d';
    }
  };






  const submitToBounty = async (bounty: HealthBountyNFT) => {
    Alert.alert(
      bounty.title,
      `${bounty.description}\n\nRequired metrics: ${bounty.requiredMetrics.join(', ')}\nReward: $${bounty.rewardAmount} USD\nAddress: ${bounty.addressDisplay}\nParticipants: ${bounty.participants}\n\nSubmitting will:\n• Encrypt your health data\n• Remove all personal information\n• Upload to secure storage\n• Receive test HBAR payment`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Data',
          onPress: async () => {
            try {
              setLoading(true);
              setLoadingBountyId(bounty.id);
              console.log(`📤 Submitting data to bounty: ${bounty.title}`);
              
              // Load health data from storage
              const healthDataStr = await AsyncStorage.getItem('@fitcentive_health_data');
              if (!healthDataStr) {
                Alert.alert('Error', 'No health data available. Please generate or fetch health data first.');
                return;
              }
              
              const healthData = JSON.parse(healthDataStr);
              console.log('📊 Health data loaded:', Object.keys(healthData));
              
              // Filter data to only include required metrics for this bounty
              const filteredData: any = {};
              for (const metric of bounty.requiredMetrics) {
                // Map display names to actual data keys
                const dataKey = mapMetricToDataKey(metric);
                if (healthData[dataKey]) {
                  filteredData[dataKey] = healthData[dataKey];
                }
              }
              
              console.log('🎯 Filtered data for bounty:', Object.keys(filteredData));
              
              // Anonymize the data (remove personal information)
              const anonymizedData = await HealthNFTService.generateAnonymizedBundle(filteredData);
              console.log('🔒 Data anonymized for submission');
              
              // Upload anonymized data to Walrus
              const dataBlob = await WalrusService.uploadBlob(
                JSON.stringify(anonymizedData.anonymizedData),
                true // encrypted
              );
              console.log('📦 Data uploaded to Walrus:', dataBlob.id);
              
              // Initialize Hedera service and send test HBAR
              await HederaBlockchainService.initialize();
              
              // Generate simulated Hedera transaction ID for NFT transfer (proper format: accountId@timestamp.nanoseconds)
              const accountId = Math.floor(Math.random() * 1000000) + 1000;
              const timestamp = Math.floor(Date.now() / 1000);
              const nanoseconds = Math.floor(Math.random() * 999999999);
              const hederaTransactionId = `0.0.${accountId}@${timestamp}.${nanoseconds}`;
              const nftTokenId = `0.0.${Math.floor(Math.random() * 100000)}`;
              
              // Simulate sending test HBAR (in a real implementation, this would be done by the bounty provider)
              console.log(`💰 Simulating test HBAR payment to user wallet`);
              console.log(`📨 Data sent to address: ${bounty.address}`);
              console.log(`🎨 NFT Token ID: ${nftTokenId}`);
              console.log(`🔗 Hedera Transaction: ${hederaTransactionId}`);
              
              // Update wallet balance in storage
              try {
                const currentBalanceStr = await AsyncStorage.getItem('@fitcentive_wallet_balance');
                const currentBalance = currentBalanceStr ? parseFloat(currentBalanceStr) : 100.0;
                const newBalance = currentBalance + bounty.rewardAmount;
                await AsyncStorage.setItem('@fitcentive_wallet_balance', newBalance.toString());
                console.log(`💰 Updated wallet balance: ${newBalance} HBAR`);
                
                // Add transaction record
                const transactions = [];
                const existingTransactionsStr = await AsyncStorage.getItem('@fitcentive_wallet_transactions');
                if (existingTransactionsStr) {
                  transactions.push(...JSON.parse(existingTransactionsStr));
                }
                
                transactions.unshift({
                  id: Date.now().toString(),
                  type: 'received',
                  amount: bounty.rewardAmount,
                  from: `${bounty.title} Bounty`,
                  timestamp: new Date().toISOString(),
                  description: `Reward for submitting ${bounty.requiredMetrics.join(', ')} data`,
                  hederaTransactionId: hederaTransactionId,
                  nftTokenId: nftTokenId,
                  walrusBlobId: dataBlob.id
                });
                
                await AsyncStorage.setItem('@fitcentive_wallet_transactions', JSON.stringify(transactions));
                console.log(`📝 Added transaction record for ${bounty.rewardAmount} HBAR`);
              } catch (walletError) {
                console.error('❌ Error updating wallet:', walletError);
              }
              
              Alert.alert(
                'Data Submitted Successfully',
                `Your anonymized health data has been submitted to ${bounty.title} study. You will receive ${bounty.rewardAmount} test HBAR as reward.`,
                [
                  {
                    text: 'View Walrus Data',
                    onPress: () => {
                      console.log(`🔗 Opening Walruscan for blob: ${dataBlob.id}`);
                      const walruscanUrl = `https://walruscan.com/testnet/blob/${dataBlob.id}`;
                      Linking.canOpenURL(walruscanUrl).then(supported => {
                        if (supported) {
                          Linking.openURL(walruscanUrl);
                        } else {
                          Alert.alert(
                            'Walrus Data Explorer',
                            `View your submitted data on Walrus blockchain at walruscan.com. Copy this URL: ${walruscanUrl}`,
                            [{ text: 'OK' }]
                          );
                        }
                      });
                    }
                  },
                  {
                    text: 'View Hedera NFT',
                    onPress: () => {
                      console.log(`🔗 Opening Hedera HashScan for transaction: ${hederaTransactionId}`);
                      const hashscanUrl = `https://hashscan.io/testnet/transaction/${hederaTransactionId}`;
                      Linking.canOpenURL(hashscanUrl).then(supported => {
                        if (supported) {
                          Linking.openURL(hashscanUrl);
                        } else {
                          Alert.alert(
                            'Hedera NFT Transaction',
                            `View transaction ${hederaTransactionId} on HashScan. NFT Token: ${nftTokenId}`,
                            [{ text: 'OK' }]
                          );
                        }
                      });
                    }
                  },
                  { text: 'OK', style: 'default' }
                ]
              );
            } catch (error) {
              console.error('Error submitting to bounty:', error);
              Alert.alert('Error', 'Failed to submit data to bounty: ' + error.message);
            } finally {
              setLoading(false);
              setLoadingBountyId(null);
            }
          }
        }
      ]
    );
  };

  const BountyCard = ({ bounty }: { bounty: HealthBountyNFT }) => {
    const isLoading = loadingBountyId === bounty.id;
    
    return (
      <View style={[styles.packageCard, styles.bountyCard]}>
        <View style={styles.packageHeader}>
          <View style={styles.packageInfo}>
            <Text style={styles.packageTitle}>{bounty.title}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(bounty.rarity) }]}>
              <Text style={styles.rarityText}>{bounty.rarity}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${bounty.rewardAmount}</Text>
            <Text style={styles.currency}>USD</Text>
          </View>
        </View>
        
        <Text style={styles.packageDescription}>{bounty.description}</Text>
        
        <View style={styles.bountyStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Participants</Text>
            <Text style={styles.statValue}>{bounty.participants}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Address</Text>
            <Text style={styles.statValue}>{bounty.addressDisplay}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Category</Text>
            <Text style={styles.statValue}>{bounty.category}</Text>
          </View>
        </View>

        <View style={styles.metricsContainer}>
          <Text style={styles.metricsLabel}>Required Metrics:</Text>
          <View style={styles.metricsRow}>
            {bounty.requiredMetrics.map((metric, index) => (
              <View key={`metric-${index}`} style={styles.metricTag}>
                <Text style={styles.metricText}>{metric}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
          onPress={() => submitToBounty(bounty)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>🎯 Submit Data</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Research Bounties</Text>
          <Text style={styles.subtitle}>Contribute anonymized health data to research studies and earn rewards</Text>
        </View>

        {/* Health Bounties */}
        <View style={styles.section}>
          
          {healthBounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </View>


        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Submitting to bounty...</Text>
          </View>
        )}
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00D4AA',
  },
  bountyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b35',
    backgroundColor: '#fff9f5',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageInfo: {
    flex: 1,
    marginRight: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7B61FF',
  },
  currency: {
    fontSize: 14,
    color: '#666',
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  packageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#1976d2',
  },
  listButton: {
    backgroundColor: '#00D4AA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  listButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#28a745',
  },
  soldStatus: {
    backgroundColor: '#6c757d',
  },
  pendingStatus: {
    backgroundColor: '#ffc107',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  listedStat: {
    fontSize: 14,
    color: '#666',
  },
  transactionId: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  bountyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#fff5f0',
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  submitButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});