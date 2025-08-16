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
import DateTimePicker from '@react-native-community/datetimepicker';
import HealthKitService, { HealthDataRange, HealthMetric } from '../services/healthKit';
import WalrusService, { WalrusBlob } from '../services/walrus';

interface MetricToggle {
  hrv: boolean;
  rhr: boolean;
  calories: boolean;
  exercise: boolean;
}

interface UploadStatus {
  metric: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  blobId?: string;
  error?: string;
}

export default function HealthImportScreen() {
  const [isHealthKitAvailable, setIsHealthKitAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [metrics, setMetrics] = useState<MetricToggle>({
    hrv: true,
    rhr: true,
    calories: true,
    exercise: true,
  });
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    console.log('🎯 [SCREEN] HealthImportScreen useEffect called - initializing HealthKit');
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

  const fetchHealthData = async () => {
    console.log('🎯 [UI] fetchHealthData called');
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
      const range: HealthDataRange = { startDate, endDate };
      const data = await HealthKitService.getAllHealthData(range);
      setHealthData(data);
      
      const dataSource = HealthKitService.isUsingMockData() ? 'Demo' : 'Apple Health';
      Alert.alert(
        'Data Fetched',
        `Successfully fetched from ${dataSource}:\n` +
        `• HRV: ${data.hrv.length} samples\n` +
        `• RHR: ${data.rhr.length} samples\n` +
        `• Calories: ${data.calories.length} samples\n` +
        `• Exercise: ${data.exercise.length} samples`
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
      // Upload each selected metric
      if (metrics.hrv && healthData.hrv.length > 0) {
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

      if (metrics.rhr && healthData.rhr.length > 0) {
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

      if (metrics.calories && healthData.calories.length > 0) {
        statuses.push({ metric: 'Calories', status: 'uploading' });
        setUploadStatuses([...statuses]);
        
        const blob = await WalrusService.uploadHealthData(healthData.calories, {
          metric: 'calories',
          startDate,
          endDate,
          samples: healthData.calories.length,
        });
        
        blobs.set('calories', blob);
        statuses[statuses.length - 1] = { 
          metric: 'Calories', 
          status: 'success', 
          blobId: blob.id 
        };
        setUploadStatuses([...statuses]);
      }

      if (metrics.exercise && healthData.exercise.length > 0) {
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
          'Upload Complete',
          `Successfully uploaded ${blobs.size} metrics to Walrus!\n\nManifest ID: ${manifestBlob.id}`
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
        <Text style={styles.title}>Import Health Data</Text>
        
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
              ? '✅ Real health data access granted' 
              : '📱 Tap "Connect & Fetch Health Data" to access your real Apple Health data'
            }
          </Text>
        </View>
        
        {/* Date Range Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateLabel}>Start Date:</Text>
            <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateLabel}>End Date:</Text>
            <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showStartPicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="compact"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            </View>
          )}

          {showEndPicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={endDate}
                mode="date"
                display="compact"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            </View>
          )}
        </View>

        {/* Metric Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Metrics</Text>
          
          {Object.entries(metrics).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={styles.metricRow}
              onPress={() => toggleMetric(key as keyof MetricToggle)}
            >
              <View style={[styles.checkbox, value && styles.checkboxSelected]}>
                {value && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.metricLabel}>
                {key === 'hrv' && 'Heart Rate Variability (HRV)'}
                {key === 'rhr' && 'Resting Heart Rate'}
                {key === 'calories' && 'Active Calories'}
                {key === 'exercise' && 'Exercise Minutes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
                {HealthKitService.isUsingMockData() ? 'Connect to Apple Health' : 'Fetch Health Data'}
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
  datePickerContainer: {
    minHeight: 44,
    marginVertical: 8,
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
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateLabel: {
    fontSize: 16,
    color: '#666',
  },
  dateValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 16,
    color: '#333',
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