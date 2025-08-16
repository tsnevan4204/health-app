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

interface DataPackage {
  id: string;
  title: string;
  description: string;
  metrics: string[];
  duration: string;
  samples: number;
  price: number;
  currency: string;
  category: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

interface ListedPackage extends DataPackage {
  status: 'active' | 'sold' | 'pending';
  views: number;
  listedAt: Date;
  transactionId?: string;
}

export default function SellScreen() {
  const [availablePackages, setAvailablePackages] = useState<DataPackage[]>([
    {
      id: 'hrv_30d',
      title: 'HRV Premium Dataset',
      description: '30 days of high-quality heart rate variability data from active individual',
      metrics: ['HRV', 'Sleep Quality', 'Stress Levels'],
      duration: '30 days',
      samples: 720,
      price: 25.5,
      currency: 'FLOW',
      category: 'Cardiovascular',
      rarity: 'Epic',
    },
    {
      id: 'complete_wellness',
      title: 'Complete Wellness Bundle',
      description: 'Comprehensive health metrics including HRV, exercise, weight, and heart rate',
      metrics: ['HRV', 'RHR', 'Weight', 'Exercise', 'Biological Age'],
      duration: '30 days',
      samples: 150,
      price: 45.0,
      currency: 'FLOW',
      category: 'Wellness',
      rarity: 'Legendary',
    },
    {
      id: 'exercise_data',
      title: 'Athletic Performance Data',
      description: 'Daily exercise minutes and intensity data from fitness enthusiast',
      metrics: ['Exercise Minutes', 'Heart Rate Zones', 'Recovery'],
      duration: '30 days',
      samples: 30,
      price: 15.0,
      currency: 'FLOW',
      category: 'Fitness',
      rarity: 'Rare',
    },
  ]);

  const [listedPackages, setListedPackages] = useState<ListedPackage[]>([]);
  const [loading, setLoading] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return '#6c757d';
      case 'Rare': return '#17a2b8';
      case 'Epic': return '#6f42c1';
      case 'Legendary': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const simulateFlowTransaction = async (packageData: DataPackage): Promise<string> => {
    // Simulate Flow blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `flow_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const listDataPackage = async (dataPackage: DataPackage) => {
    try {
      setLoading(true);
      
      Alert.alert(
        'List Data Package',
        `Are you sure you want to list "${dataPackage.title}" for ${dataPackage.price} FLOW?\n\nThis will:\n• Create an NFT on Flow blockchain\n• Anonymize your data\n• Make it available in the marketplace`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'List for Sale',
            onPress: async () => {
              try {
                // Simulate blockchain transaction
                const transactionId = await simulateFlowTransaction(dataPackage);
                
                const listedPackage: ListedPackage = {
                  ...dataPackage,
                  status: 'active',
                  views: 0,
                  listedAt: new Date(),
                  transactionId,
                };

                setListedPackages(prev => [...prev, listedPackage]);
                setAvailablePackages(prev => prev.filter(p => p.id !== dataPackage.id));

                Alert.alert(
                  'Successfully Listed! 🎉',
                  `Your data package has been minted as an NFT on Flow blockchain.\n\nTransaction ID: ${transactionId}\n\nYour data is now available in the marketplace!`
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to list data package on Flow blockchain');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error listing package:', error);
      Alert.alert('Error', 'Failed to list data package');
    } finally {
      setLoading(false);
    }
  };

  const viewMarketplace = () => {
    Alert.alert(
      'Flow Marketplace',
      'Your data packages are now live on the Flow blockchain marketplace! \n\n🌊 Flow Features:\n• Fast, low-cost transactions\n• Developer-friendly smart contracts\n• Sustainable proof-of-stake consensus\n• Built for mainstream adoption\n\nVisit flow.com to explore the ecosystem and track your NFT sales.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const PackageCard = ({ package: pkg, onList }: { package: DataPackage; onList: () => void }) => (
    <View style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <View style={styles.packageInfo}>
          <Text style={styles.packageTitle}>{pkg.title}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(pkg.rarity) }]}>
            <Text style={styles.rarityText}>{pkg.rarity}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{pkg.price}</Text>
          <Text style={styles.currency}>{pkg.currency}</Text>
        </View>
      </View>
      
      <Text style={styles.packageDescription}>{pkg.description}</Text>
      
      <View style={styles.packageStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{pkg.duration}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Samples</Text>
          <Text style={styles.statValue}>{pkg.samples}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Category</Text>
          <Text style={styles.statValue}>{pkg.category}</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <Text style={styles.metricsLabel}>Included Metrics:</Text>
        <View style={styles.metricsRow}>
          {pkg.metrics.map((metric, index) => (
            <View key={index} style={styles.metricTag}>
              <Text style={styles.metricText}>{metric}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.listButton} onPress={onList}>
        <Text style={styles.listButtonText}>🌊 List on Flow</Text>
      </TouchableOpacity>
    </View>
  );

  const ListedCard = ({ package: pkg }: { package: ListedPackage }) => (
    <View style={[styles.packageCard, styles.listedCard]}>
      <View style={styles.listedHeader}>
        <Text style={styles.packageTitle}>{pkg.title}</Text>
        <View style={[styles.statusBadge, styles[`${pkg.status}Status`]]}>
          <Text style={styles.statusText}>{pkg.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.listedStats}>
        <Text style={styles.listedStat}>💰 {pkg.price} FLOW</Text>
        <Text style={styles.listedStat}>👁 {pkg.views} views</Text>
        <Text style={styles.listedStat}>📅 {pkg.listedAt.toLocaleDateString()}</Text>
      </View>
      
      {pkg.transactionId && (
        <Text style={styles.transactionId}>TX: {pkg.transactionId}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sell Your Data</Text>
          <Text style={styles.subtitle}>Monetize your health data on Flow blockchain</Text>
        </View>

        {/* Flow Blockchain Info */}
        <TouchableOpacity style={styles.flowCard} onPress={viewMarketplace}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowTitle}>🌊 Flow Blockchain</Text>
            <Text style={styles.flowBadge}>Tap to Learn More</Text>
          </View>
          <Text style={styles.flowDescription}>
            Fast, developer-friendly blockchain designed for mainstream adoption. 
            Low fees, high throughput, and sustainable proof-of-stake consensus.
          </Text>
        </TouchableOpacity>

        {/* Available Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Data Packages</Text>
          <Text style={styles.sectionSubtitle}>Create NFTs from your health data</Text>
          
          {availablePackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onList={() => listDataPackage(pkg)}
            />
          ))}
          
          {availablePackages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No data packages available</Text>
              <Text style={styles.emptySubtext}>Generate health data on the Home tab to create packages</Text>
            </View>
          )}
        </View>

        {/* Listed Packages */}
        {listedPackages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Listed Packages</Text>
            <Text style={styles.sectionSubtitle}>Active on Flow marketplace</Text>
            
            {listedPackages.map((pkg) => (
              <ListedCard key={pkg.id} package={pkg} />
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Creating NFT on Flow...</Text>
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
});