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
} from 'react-native';
import flowBlockchainService from '../services/flowBlockchainHTTP';
import HealthNFTService, { HealthBountyNFT } from '../services/healthNFTService';

export default function SellScreen() {



  const [healthBounties, setHealthBounties] = useState<HealthBountyNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [testnetStatus, setTestnetStatus] = useState<{
    isConnected: boolean;
    blockHeight: number | null;
    balance: number;
  } | null>(null);
  
  // Check testnet status and load health bounties on component mount
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await flowBlockchainService.checkTestnetStatus();
        setTestnetStatus(status);
        
        if (!status.isConnected) {
          console.warn('⚠️ Flow testnet connection issues detected');
        }
        
        if (status.balance === 0) {
          console.warn('⚠️ Service account has 0 FLOW balance');
          console.log('💡 Visit https://testnet-faucet.onflow.org/ to fund the account');
        }
      } catch (error) {
        console.error('❌ Failed to check testnet status:', error);
        setTestnetStatus({ isConnected: false, blockHeight: null, balance: 0 });
      }
    };
    
    // Load health bounties
    const loadBounties = () => {
      try {
        const bounties = HealthNFTService.getPredefinedHealthBounties();
        setHealthBounties(bounties);
        console.log(`📋 Loaded ${bounties.length} health bounties`);
      } catch (error) {
        console.error('❌ Failed to load health bounties:', error);
      }
    };
    
    checkStatus();
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





  const viewMarketplace = () => {
    Alert.alert(
      'Flow Marketplace',
      'Your data packages are now live on the Flow blockchain marketplace! \n\n🌊 Flow Features:\n• Fast, low-cost transactions\n• Developer-friendly smart contracts\n• Sustainable proof-of-stake consensus\n• Built for mainstream adoption\n\nVisit flow.com to explore the ecosystem and track your NFT sales.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const submitToBounty = async (bounty: HealthBountyNFT) => {
    Alert.alert(
      'Submit Health Data',
      `Submit your anonymized health data to: "${bounty.title}"\n\nRequired metrics: ${bounty.requiredMetrics.join(', ')}\nReward: ${bounty.rewardAmount} FLOW\n\nThis will:\n• Upload your anonymized health data to Walrus\n• Remove all personal information\n• Create encrypted data stream\n• Submit to research bounty`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Data',
          onPress: () => {
            Alert.alert(
              'Data Submitted! 🎯',
              `Your anonymized health data has been submitted to the research bounty!\n\n📊 Metrics: ${bounty.requiredMetrics.join(', ')}\n💰 Reward: ${bounty.rewardAmount} FLOW\n🔒 Privacy: Fully anonymized\n\nResearchers will review your submission and rewards will be distributed upon acceptance.\n\nGo to the Home tab to upload your health data as an encrypted stream to Walrus.`
            );
          }
        }
      ]
    );
  };





  const BountyCard = ({ bounty }: { bounty: HealthBountyNFT }) => (
    <View style={[styles.packageCard, styles.bountyCard]}>
      <View style={styles.packageHeader}>
        <View style={styles.packageInfo}>
          <Text style={styles.packageTitle}>{bounty.title}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(bounty.rarity) }]}>
            <Text style={styles.rarityText}>{bounty.rarity}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{bounty.rewardAmount}</Text>
          <Text style={styles.currency}>{bounty.currency}</Text>
        </View>
      </View>
      
      <Text style={styles.packageDescription}>{bounty.description}</Text>
      
      <View style={styles.bountyStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Participants</Text>
          <Text style={styles.statValue}>{bounty.participants}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Deadline</Text>
          <Text style={styles.statValue}>{bounty.deadline.toLocaleDateString()}</Text>
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
            <View key={index} style={styles.metricTag}>
              <Text style={styles.metricText}>{metric}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={() => submitToBounty(bounty)}>
        <Text style={styles.submitButtonText}>🎯 Submit Data</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Research Marketplace</Text>
          <Text style={styles.subtitle}>Earn rewards by contributing anonymized health data to research</Text>
        </View>

        {/* Flow Blockchain Info */}
        <TouchableOpacity style={styles.flowCard} onPress={viewMarketplace}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowTitle}>🌊 Flow Testnet</Text>
            <Text style={styles.flowBadge}>Gasless Transactions</Text>
          </View>
          <Text style={styles.flowDescription}>
            Fast, developer-friendly blockchain designed for mainstream adoption. 
            Low fees, high throughput, and sustainable proof-of-stake consensus.
          </Text>
          
          {/* Testnet Status */}
          {testnetStatus && (
            <View style={styles.testnetStatus}>
              <Text style={styles.testnetStatusText}>
                {testnetStatus.isConnected ? '✅' : '❌'} Connection: {testnetStatus.isConnected ? 'Active' : 'Failed'}
              </Text>
              {testnetStatus.blockHeight && (
                <Text style={styles.testnetStatusText}>📦 Block: {testnetStatus.blockHeight}</Text>
              )}
              <Text style={styles.testnetStatusText}>
                💰 Balance: {testnetStatus.balance.toFixed(2)} FLOW
              </Text>
              {testnetStatus.balance === 0 && (
                <Text style={styles.warningText}>⚠️ Service account needs funding</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Health Bounties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Health Research Bounties</Text>
          <Text style={styles.sectionSubtitle}>Earn rewards by contributing your anonymized health data</Text>
          
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
  flowCard: {
    backgroundColor: '#00D4AA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flowTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  flowBadge: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flowDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  testnetStatus: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  testnetStatusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#ffeb3b',
    fontWeight: 'bold',
    marginTop: 4,
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
    color: '#00D4AA',
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
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});