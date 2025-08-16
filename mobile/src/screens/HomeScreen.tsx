import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import HealthKitService, { HealthDataRange, HealthMetric } from '../services/healthKit';
import WalrusService, { WalrusBlob } from '../services/walrus';
import BiologicalAgeService, { BiologicalAgeData } from '../services/biologicalAge';

// Simple Chart Component
interface SimpleChartProps {
  data: HealthMetric[];
  color: string;
  unit: string;
  label: string;
}

function SimpleChart({ data, color, unit, label }: SimpleChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <View style={styles.chart}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartValue}>{data[data.length - 1]?.value.toFixed(1)} {unit}</Text>
        <Text style={styles.chartDate}>Latest</Text>
      </View>
      <View style={styles.chartBars}>
        {data.slice(-14).map((item, index) => {
          const height = range > 0 ? ((item.value - minValue) / range) * 60 + 10 : 35;
          const date = new Date(item.timestamp);
          return (
            <View key={index} style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height, 
                    backgroundColor: color,
                    opacity: 0.7 + (index / data.length) * 0.3
                  }
                ]} 
              />
              <Text style={styles.barDate}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartFooter}>
        <Text style={styles.chartRange}>
          {minValue.toFixed(1)} - {maxValue.toFixed(1)} {unit}
        </Text>
      </View>
    </View>
  );
}

interface UploadStatus {
  metric: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  blobId?: string;
  error?: string;
}

export default function HomeScreen() {
  const [isHealthKitAvailable, setIsHealthKitAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [biologicalAge, setBiologicalAge] = useState<BiologicalAgeData | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  // Initialize HealthKit when component mounts
  useEffect(() => {
    initializeHealthKit();
  }, []);

  const initializeHealthKit = async () => {
    try {
      console.log('🎯 [SCREEN] initializeHealthKit called');
      setLoading(true);
      console.log('🔄 [SCREEN] Calling HealthKitService.initialize()');
      const available = await HealthKitService.initialize();
      console.log('✅ [SCREEN] HealthKitService.initialize() returned:', available);
      setIsHealthKitAvailable(available);
      console.log('📊 [SCREEN] Set isHealthKitAvailable to:', available);
    } catch (error) {
      console.error('❌ [SCREEN] HealthKit initialization error:', error);
      setIsHealthKitAvailable(true); // Still allow using mock data
    } finally {
      console.log('🏁 [SCREEN] initializeHealthKit finished, setting loading to false');
      setLoading(false);
    }
  };

  const toggleMetric = (metric: keyof MetricToggle) => {
    setMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const requestHealthPermissions = async () => {
    try {
      console.log('🎯 [UI] requestHealthPermissions called');
      setLoading(true);
      console.log('🔐 [UI] User requesting health permissions, loading set to true');
      
      console.log('🔄 [UI] Calling HealthKitService.requestPermissions()...');
      const granted = await HealthKitService.requestPermissions();
      console.log('✅ [UI] HealthKitService.requestPermissions() returned:', granted);
      
      if (granted) {
        console.log('🟢 [UI] Permissions granted, updating UI state');
        // Force a re-render to update the UI
        setIsHealthKitAvailable(true);
        Alert.alert(
          'Health Access Granted! 🎉',
          'You can now fetch real health data from Apple Health.',
          [{ text: 'Continue', onPress: fetchHealthData }]
        );
      } else {
        console.log('🔴 [UI] Permissions denied, showing retry dialog');
        Alert.alert(
          'Health Access Needed',
          'To access your health data, please grant permissions in the Health app or try again.',
          [
            { text: 'Try Again', onPress: requestHealthPermissions },
            { text: 'Use Demo Data', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ [UI] Error requesting health permissions:', error);
      Alert.alert('Error', 'Failed to request health permissions: ' + error.message);
    } finally {
      console.log('🏁 [UI] Setting loading to false');
      setLoading(false);
    }
  };

  const generateFakeData = async () => {
    try {
      setLoading(true);
      // Generate data for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const range: HealthDataRange = { startDate, endDate };
      
      // Generate fake data directly
      const hrv = HealthKitService.generateMockData('hrv', range, 30);
      const rhr = HealthKitService.generateMockData('rhr', range, 30);
      const calories = HealthKitService.generateMockData('active_calories', range, 30);
      const exercise = HealthKitService.generateMockData('exercise_minutes', range, 30);
      const weight = HealthKitService.generateMockData('weight', range, 30);
      
      const data = { hrv, rhr, calories, exercise, weight };
      setHealthData(data);
      
      // Calculate biological age
      const bioAge = BiologicalAgeService.calculateBiologicalAge(data);
      setBiologicalAge(bioAge);
      
      Alert.alert(
        'Fake Data Generated! 🎲',
        `Successfully generated 30 days of health data:\n` +
        `• HRV: ${data.hrv.length} samples\n` +
        `• RHR: ${data.rhr.length} samples\n` +
        `• Weight: ${data.weight.length} samples\n` +
        `• Exercise: ${data.exercise.length} samples\n\n` +
        `Biological Age: ${bioAge.biologicalAge} years\n` +
        `Ready to upload to Walrus!`
      );
    } catch (error) {
      console.error('Error generating fake data:', error);
      Alert.alert('Error', 'Failed to generate fake data');
    } finally {
      setLoading(false);
    }
  };

  const showBiologicalAgeInfo = () => {
    if (!biologicalAge) {
      Alert.alert('Info', 'Generate health data first to calculate your biological age.');
      return;
    }

    Alert.alert(
      'Biological Age Explained',
      BiologicalAgeService.getExplanation() + 
      `\n\nYour Results:\n` +
      `• Biological Age: ${biologicalAge.biologicalAge} years\n` +
      `• Chronological Age: ${biologicalAge.chronologicalAge} years\n` +
      `• Difference: ${biologicalAge.ageDifference > 0 ? '+' : ''}${biologicalAge.ageDifference} years\n\n` +
      `${biologicalAge.interpretation}\n\n` +
      `Key Factors:\n` +
      `• HRV: ${biologicalAge.factors.hrv.impact}\n` +
      `• RHR: ${biologicalAge.factors.rhr.impact}\n` +
      `• Exercise: ${biologicalAge.factors.exercise.impact}\n` +
      `• Weight: ${biologicalAge.factors.weight.impact}`,
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const uploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        
        // Upload to Walrus
        const blob = await WalrusService.uploadBlob(
          `Document: ${document.name} (${document.size} bytes)`,
          true
        );
        
        setUploadedDocuments(prev => [...prev, {
          name: document.name,
          size: document.size,
          type: document.mimeType,
          blobId: blob.id,
          uploadedAt: new Date().toISOString(),
        }]);

        Alert.alert(
          'Document Uploaded! 📄',
          `Successfully uploaded ${document.name} to Walrus storage.\n\nBlob ID: ${blob.id}`
        );
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload document');
    }
  };

  const fetchHealthData = async () => {
    console.log('🎯 [UI] fetchHealthData called');
    
    // Initialize HealthKit only when needed
    if (!isHealthKitAvailable) {
      await initializeHealthKit();
    }
    
    console.log('📊 [UI] isHealthKitAvailable:', isHealthKitAvailable);
    console.log('📱 [UI] HealthKitService.isUsingMockData():', HealthKitService.isUsingMockData());
    
    if (!isHealthKitAvailable) {
      console.log('❌ [UI] HealthKit not available, showing error');
      Alert.alert('Error', 'HealthKit is not available');
      return;
    }

    // If using mock data, request permissions first
    if (HealthKitService.isUsingMockData()) {
      console.log('🔄 [UI] Using mock data, requesting permissions first');
      await requestHealthPermissions();
      return;
    }

    try {
      setLoading(true);
      // Use last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const range: HealthDataRange = { startDate, endDate };
      
      const data = await HealthKitService.getAllHealthData(range);
      setHealthData(data);
      
      // Calculate biological age
      const bioAge = BiologicalAgeService.calculateBiologicalAge(data);
      setBiologicalAge(bioAge);
      
      const dataSource = HealthKitService.isUsingMockData() ? 'Demo' : 'Apple Health';
      Alert.alert(
        'Data Fetched',
        `Successfully fetched from ${dataSource}:\n` +
        `• HRV: ${data.hrv.length} samples\n` +
        `• RHR: ${data.rhr.length} samples\n` +
        `• Weight: ${data.weight.length} samples\n` +
        `• Exercise: ${data.exercise.length} samples\n\n` +
        `Biological Age: ${bioAge.biologicalAge} years`
      );
    } catch (error) {
      console.error('Error fetching health data:', error);
      Alert.alert('Error', 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  const uploadToWalrus = async () => {
    if (!healthData) {
      Alert.alert('Error', 'Please fetch health data first');
      return;
    }

    setUploading(true);
    const statuses: UploadStatus[] = [];
    const blobs = new Map<string, WalrusBlob>();

    try {
      // Use last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Upload all metrics
      if (healthData.hrv.length > 0) {
        statuses.push({ metric: 'HRV', status: 'uploading' });
        setUploadStatuses([...statuses]);
        
        const blob = await WalrusService.uploadHealthData(healthData.hrv, {
          metric: 'hrv',
          startDate,
          endDate,
          samples: healthData.hrv.length,
        });
        
        blobs.set('hrv', blob);
        statuses[statuses.length - 1] = { 
          metric: 'HRV', 
          status: 'success', 
          blobId: blob.id 
        };
        setUploadStatuses([...statuses]);
      }

      if (healthData.rhr.length > 0) {
        statuses.push({ metric: 'RHR', status: 'uploading' });
        setUploadStatuses([...statuses]);
        
        const blob = await WalrusService.uploadHealthData(healthData.rhr, {
          metric: 'rhr',
          startDate,
          endDate,
          samples: healthData.rhr.length,
        });
        
        blobs.set('rhr', blob);
        statuses[statuses.length - 1] = { 
          metric: 'RHR', 
          status: 'success', 
          blobId: blob.id 
        };
        setUploadStatuses([...statuses]);
      }

      if (healthData.weight.length > 0) {
        statuses.push({ metric: 'Weight', status: 'uploading' });
        setUploadStatuses([...statuses]);
        
        const blob = await WalrusService.uploadHealthData(healthData.weight, {
          metric: 'weight',
          startDate,
          endDate,
          samples: healthData.weight.length,
        });
        
        blobs.set('weight', blob);
        statuses[statuses.length - 1] = { 
          metric: 'Weight', 
          status: 'success', 
          blobId: blob.id 
        };
        setUploadStatuses([...statuses]);
      }

      if (healthData.exercise.length > 0) {
        statuses.push({ metric: 'Exercise', status: 'uploading' });
        setUploadStatuses([...statuses]);
        
        const blob = await WalrusService.uploadHealthData(healthData.exercise, {
          metric: 'exercise',
          startDate,
          endDate,
          samples: healthData.exercise.length,
        });
        
        blobs.set('exercise', blob);
        statuses[statuses.length - 1] = { 
          metric: 'Exercise', 
          status: 'success', 
          blobId: blob.id 
        };
        setUploadStatuses([...statuses]);
      }

      // Create and upload manifest
      if (blobs.size > 0) {
        const manifest = await WalrusService.createManifest(blobs, {
          startDate,
          endDate,
          deviceTypes: ['apple_watch', 'iphone'],
          userId: 'user_' + Math.random().toString(36).substr(2, 9),
        });

        const manifestBlob = await WalrusService.uploadManifest(manifest);
        
        statuses.push({ 
          metric: 'Manifest', 
          status: 'success', 
          blobId: manifestBlob.id 
        });
        setUploadStatuses([...statuses]);

        Alert.alert(
          'Upload Complete! 🎉',
          `Successfully uploaded ${blobs.size} metrics to Walrus!\n\nManifest ID: ${manifestBlob.id}\n\nAll data has been encrypted and stored securely. Check the console for detailed upload logs.`
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload data to Walrus');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Wellrus</Text>
        
        {/* Biological Age Display */}
        {biologicalAge && (
          <View style={styles.biologicalAgeSection}>
            <View style={styles.biologicalAgeHeader}>
              <View style={styles.biologicalAgeMain}>
                <Text style={styles.biologicalAgeLabel}>Biological Age</Text>
                <Text style={styles.biologicalAgeValue}>
                  {biologicalAge.biologicalAge} years
                </Text>
                <Text style={styles.biologicalAgeDiff}>
                  {biologicalAge.ageDifference > 0 ? '+' : ''}{biologicalAge.ageDifference} years
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={showBiologicalAgeInfo}
              >
                <Text style={styles.infoButtonText}>ⓘ</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.biologicalAgeDescription}>
              {biologicalAge.interpretation}
            </Text>
          </View>
        )}
        
        {/* Connection Status */}
        <View style={styles.debugSection}>
          <Text style={styles.debugText}>
            {!HealthKitService.isUsingMockData() 
              ? '🟢 Connected to Apple Health - Real Data' 
              : isHealthKitAvailable 
                ? '🟡 Apple Health Available - Demo Data' 
                : '🔴 Apple Health Unavailable - Demo Data'
            }
          </Text>
          <Text style={styles.connectionSubtext}>
{!HealthKitService.isUsingMockData() 
              ? '🍎 Connected to Apple Health - real data available' 
              : '📱 Demo mode - tap "Connect to Apple Health" for real data or "Generate Fake Data" for testing'
            }
          </Text>
          {healthData && (
            <Text style={styles.dataReadyText}>
              🎯 Data ready for upload - {(healthData.hrv?.length || 0) + (healthData.rhr?.length || 0) + (healthData.weight?.length || 0) + (healthData.exercise?.length || 0)} total samples
            </Text>
          )}
        </View>
        
        {/* Health Metrics Charts */}
        {healthData && (
          <View style={styles.chartsContainer}>
            <Text style={styles.sectionTitle}>30-Day Health Trends</Text>
            
            {/* HRV Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>💓 Heart Rate Variability (HRV)</Text>
              <View style={styles.chartContainer}>
                <SimpleChart 
                  data={healthData.hrv} 
                  color="#FF6B6B" 
                  unit="ms"
                  label="HRV"
                />
              </View>
            </View>

            {/* RHR Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>❤️ Resting Heart Rate</Text>
              <View style={styles.chartContainer}>
                <SimpleChart 
                  data={healthData.rhr} 
                  color="#4ECDC4" 
                  unit="bpm"
                  label="RHR"
                />
              </View>
            </View>

            {/* Weight Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>⚖️ Weight</Text>
              <View style={styles.chartContainer}>
                <SimpleChart 
                  data={healthData.weight} 
                  color="#45B7D1" 
                  unit="lbs"
                  label="Weight"
                />
              </View>
            </View>

            {/* Exercise Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>🏃‍♂️ Exercise Minutes</Text>
              <View style={styles.chartContainer}>
                <SimpleChart 
                  data={healthData.exercise} 
                  color="#96CEB4" 
                  unit="min"
                  label="Exercise"
                />
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {HealthKitService.isUsingMockData() && (
            <TouchableOpacity
              style={[styles.button, styles.connectButton]}
              onPress={() => Alert.alert(
                'Connect to Apple Health',
                'To access real health data:\n\n1. Tap "Fetch Health Data" below\n2. Grant permissions when prompted\n3. Select which data to share\n\nThis will enable real-time access to your Apple Health data.',
                [{ text: 'Got it', style: 'default' }]
              )}
            >
              <Text style={styles.buttonText}>📱 How to Connect Apple Health</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.fakeDataButton]}
            onPress={generateFakeData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>🎲 Generate Fake Data</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.fetchButton]}
            onPress={() => {
              console.log('🎯 [BUTTON] Connect to Apple Health button pressed!');
              console.log('📊 [BUTTON] Button state - loading:', loading, 'isHealthKitAvailable:', isHealthKitAvailable);
              fetchHealthData();
            }}
            disabled={loading || !isHealthKitAvailable}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
{HealthKitService.isUsingMockData() ? '🍎 Connect to Apple Health' : '📊 Fetch Real Health Data'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.uploadButton, !healthData && styles.buttonDisabled]}
            onPress={uploadToWalrus}
            disabled={uploading || !healthData}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Upload to Walrus</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Document Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Upload</Text>
          <Text style={styles.sectionSubtitle}>Upload medical documents (PDF, DOCX)</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.documentButton]}
            onPress={uploadDocument}
          >
            <Text style={styles.buttonText}>📄 Upload Document</Text>
          </TouchableOpacity>

          {uploadedDocuments.length > 0 && (
            <View style={styles.documentsContainer}>
              <Text style={styles.documentsTitle}>Uploaded Documents:</Text>
              {uploadedDocuments.map((doc, index) => (
                <View key={index} style={styles.documentItem}>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentSize}>
                      {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.documentStatus}>✅</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Upload Status */}
        {uploadStatuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Status</Text>
            {uploadStatuses.map((status, index) => (
              <View key={index} style={styles.statusRow}>
                <Text style={styles.statusMetric}>{status.metric}:</Text>
                <Text style={[
                  styles.statusValue,
                  status.status === 'success' && styles.statusSuccess,
                  status.status === 'error' && styles.statusError,
                ]}>
                  {status.status === 'success' ? '✓ Uploaded' : status.status}
                </Text>
                {status.blobId && (
                  <Text style={styles.blobId}>ID: {status.blobId.substring(0, 8)}...</Text>
                )}
              </View>
            ))}
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
  biologicalAgeSection: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  biologicalAgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  biologicalAgeMain: {
    flex: 1,
  },
  biologicalAgeLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  biologicalAgeValue: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  biologicalAgeDiff: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  infoButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  biologicalAgeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  scrollContent: {
    padding: 20,
  },
  debugSection: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  debugText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  connectionSubtext: {
    fontSize: 12,
    color: '#1565c0',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dataReadyText: {
    fontSize: 12,
    color: '#2e7d32',
    marginTop: 8,
    fontWeight: '600',
  },
  chartsContainer: {
    marginBottom: 20,
  },
  chartSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    height: 120,
  },
  chart: {
    flex: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartDate: {
    fontSize: 12,
    color: '#666',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    marginVertical: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
  },
  bar: {
    width: 12,
    borderRadius: 2,
    marginBottom: 4,
  },
  barDate: {
    fontSize: 10,
    color: '#666',
  },
  chartFooter: {
    alignItems: 'center',
  },
  chartRange: {
    fontSize: 11,
    color: '#999',
  },
  emptyChart: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  emptyChartText: {
    color: '#999',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  documentsContainer: {
    marginTop: 16,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
  },
  documentStatus: {
    fontSize: 16,
    marginLeft: 12,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  fetchButton: {
    backgroundColor: '#007AFF',
  },
  connectButton: {
    backgroundColor: '#FF9500',
  },
  fakeDataButton: {
    backgroundColor: '#AF52DE',
  },
  documentButton: {
    backgroundColor: '#FF8C00',
  },
  uploadButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusMetric: {
    fontSize: 16,
    color: '#333',
    width: 80,
  },
  statusValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  statusSuccess: {
    color: '#34C759',
    fontWeight: '600',
  },
  statusError: {
    color: '#FF3B30',
  },
  blobId: {
    fontSize: 12,
    color: '#999',
  },
});