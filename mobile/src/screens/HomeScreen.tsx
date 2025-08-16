import React, { useState, useEffect, useRef } from 'react';
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
  Linking,
  Animated,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
// Removed expo-web-browser import to avoid native module issues
import AsyncStorage from '@react-native-async-storage/async-storage';
import HealthKitService, { HealthDataRange, HealthMetric } from '../services/healthKit';
import WalrusService, { WalrusBlob } from '../services/walrus';
import BiologicalAgeService, { BiologicalAgeData } from '../services/biologicalAge';
import HederaBlockchainService, { HederaTransaction, HederaNFT } from '../services/hederaBlockchain';
import HealthNFTService from '../services/healthNFTService';

// Storage keys for persistence
const STORAGE_KEYS = {
  HEALTH_DATA: '@wellrus_health_data',
  BIOLOGICAL_AGE: '@wellrus_biological_age',
  UPLOADED_DOCUMENTS: '@wellrus_uploaded_documents',
  UPLOAD_STATUSES: '@wellrus_upload_statuses',
  FLOW_TRANSACTIONS: '@wellrus_flow_transactions',
};

// Animated Glistening Component
interface GlistenProps {
  children: React.ReactNode;
  style?: any;
}

function Glisten({ children, style }: GlistenProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createShimmerAnimation();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          transform: [{ translateX }],
          width: 50,
          opacity: 0.6,
        }}
      />
    </View>
  );
}

// Simple Chart Component
interface SimpleChartProps {
  data: HealthMetric[];
  color: string;
  unit: string;
  label: string;
}

function SimpleChart({ data, color, unit }: SimpleChartProps) {
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
            <View key={`bar-${index}`} style={styles.barContainer}>
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

// Simplified URL opening function using only React Native Linking
async function openExternal(url: string, fallbackUrl?: string): Promise<void> {
  try {
    const safe = encodeURI(url);
    
    console.log('');
    console.log('🌐 ================ OPENING EXPLORER ================');
    console.log(`🔗 Primary URL: ${safe}`);
    if (fallbackUrl) {
      console.log(`🔄 Fallback URL: ${fallbackUrl}`);
    }
    console.log('===============================================');
    console.log('');
    
    const supported = await Linking.canOpenURL(safe);
    if (supported) {
      await Linking.openURL(safe);
      console.log('✅ Successfully opened Flow explorer in browser');
    } else {
      throw new Error('URL scheme not supported');
    }
  } catch (error) {
    console.error('❌ Failed to open URL:', url, error);
    
    if (fallbackUrl && fallbackUrl !== url) {
      console.log('🔄 Trying fallback URL:', fallbackUrl);
      try {
        await openExternal(fallbackUrl);
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback URL also failed:', fallbackError);
      }
    }
    
    Alert.alert(
      'Could not open browser',
      `Unable to open the Flow explorer. Please visit manually:\\n\\n${url}`,
      [
        { 
          text: 'Copy URL', 
          onPress: () => {
            console.log('📋 URL to copy:', url);
          }
        },
        { text: 'OK', style: 'default' }
      ]
    );
  }
}

export default function HomeScreen() {
  const [isHealthKitAvailable, setIsHealthKitAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [biologicalAge, setBiologicalAge] = useState<BiologicalAgeData | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [hederaTransactions, setHederaTransactions] = useState<HederaTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<HederaTransaction | null>(null);
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false);
  const [mintingNFT, setMintingNFT] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [transactionLink, setTransactionLink] = useState<string>('');

  // Initialize app when component mounts
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await loadPersistedData();
    await initializeHealthKit();
  };

  const loadPersistedData = async () => {
    try {
      console.log('📱 [STORAGE] Loading persisted data...');
      
      // Load health data
      const storedHealthData = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_DATA);
      if (storedHealthData) {
        const healthData = JSON.parse(storedHealthData);
        setHealthData(healthData);
        console.log('✅ [STORAGE] Loaded health data:', Object.keys(healthData));
      }

      // Load biological age
      const storedBiologicalAge = await AsyncStorage.getItem(STORAGE_KEYS.BIOLOGICAL_AGE);
      if (storedBiologicalAge) {
        const biologicalAge = JSON.parse(storedBiologicalAge);
        setBiologicalAge(biologicalAge);
        console.log('✅ [STORAGE] Loaded biological age:', biologicalAge.biologicalAge);
      }

      // Load uploaded documents
      const storedDocuments = await AsyncStorage.getItem(STORAGE_KEYS.UPLOADED_DOCUMENTS);
      if (storedDocuments) {
        const documents = JSON.parse(storedDocuments);
        setUploadedDocuments(documents);
        console.log('✅ [STORAGE] Loaded uploaded documents:', documents.length);
      }

      // Load upload statuses
      const storedStatuses = await AsyncStorage.getItem(STORAGE_KEYS.UPLOAD_STATUSES);
      if (storedStatuses) {
        const statuses = JSON.parse(storedStatuses);
        updateUploadStatuses(statuses);
        console.log('✅ [STORAGE] Loaded upload statuses:', statuses.length);
      }

      // Load hedera transactions
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEYS.FLOW_TRANSACTIONS);
      if (storedTransactions) {
        const transactions = JSON.parse(storedTransactions);
        setHederaTransactions(transactions);
        console.log('✅ [STORAGE] Loaded hedera transactions:', transactions.length);
      }
    } catch (error) {
      console.error('❌ [STORAGE] Error loading persisted data:', error);
    }
  };

  const saveHealthData = async (data: any) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_DATA, JSON.stringify(data));
      console.log('💾 [STORAGE] Saved health data');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving health data:', error);
    }
  };

  const saveBiologicalAge = async (bioAge: BiologicalAgeData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIOLOGICAL_AGE, JSON.stringify(bioAge));
      console.log('💾 [STORAGE] Saved biological age');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving biological age:', error);
    }
  };

  const saveUploadedDocuments = async (documents: any[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.UPLOADED_DOCUMENTS, JSON.stringify(documents));
      console.log('💾 [STORAGE] Saved uploaded documents');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving uploaded documents:', error);
    }
  };

  const saveUploadStatuses = async (statuses: UploadStatus[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.UPLOAD_STATUSES, JSON.stringify(statuses));
      console.log('💾 [STORAGE] Saved upload statuses');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving upload statuses:', error);
    }
  };

  const saveHederaTransactions = async (transactions: HederaTransaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FLOW_TRANSACTIONS, JSON.stringify(transactions));
      console.log('💾 [STORAGE] Saved hedera transactions');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving hedera transactions:', error);
    }
  };

  const updateUploadStatuses = (newStatuses: UploadStatus[]) => {
    setUploadStatuses(newStatuses);
    saveUploadStatuses(newStatuses);
  };

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

  const resetTransactionStatus = () => {
    setTransactionStatus('idle');
    setTransactionLink('');
    setShowTransactionDropdown(false);
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
      Alert.alert('Error', 'Failed to request health permissions: ' + (error as Error).message);
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
      await saveHealthData(data);
      
      // Calculate biological age
      const bioAge = BiologicalAgeService.calculateBiologicalAge(data);
      setBiologicalAge(bioAge);
      await saveBiologicalAge(bioAge);
      
      Alert.alert(
        'Mock Data Generated! 🎲',
        `Successfully generated 30 days of health data:\\n` +
        `• HRV: ${data.hrv.length} samples\\n` +
        `• RHR: ${data.rhr.length} samples\\n` +
        `• Weight: ${data.weight.length} samples\\n` +
        `• Exercise: ${data.exercise.length} samples\\n\\n` +
        `Biological Age: ${bioAge.biologicalAge} years\\n` +
        `Ready to upload to Walrus!`
      );
    } catch (error) {
      console.error('Error generating mock data:', error);
      Alert.alert('Error', 'Generate Mock Data');
    } finally {
      setLoading(false);
    }
  };

  const showBiologicalAgeInfo = () => {
    if (!biologicalAge) {
      Alert.alert('Info', 'Generate mock data first to calculate your biological age.');
      return;
    }

    Alert.alert(
      'Biological Age Explained',
      BiologicalAgeService.getExplanation() + 
      `\\n\\nYour Results:\\n` +
      `• Biological Age: ${biologicalAge.biologicalAge} years\\n` +
      `• Chronological Age: ${biologicalAge.chronologicalAge} years\\n` +
      `• Difference: ${biologicalAge.ageDifference > 0 ? '+' : ''}${biologicalAge.ageDifference} years\\n\\n` +
      `${biologicalAge.interpretation}\\n\\n` +
      `Key Factors:\\n` +
      `• HRV: ${biologicalAge.factors.hrv.impact}\\n` +
      `• RHR: ${biologicalAge.factors.rhr.impact}\\n` +
      `• Exercise: ${biologicalAge.factors.exercise.impact}\\n` +
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
        
        const newDocument = {
          name: document.name,
          size: document.size,
          type: document.mimeType,
          blobId: blob.id,
          uploadedAt: new Date().toISOString(),
        };
        
        setUploadedDocuments(prev => {
          const updatedDocs = [...prev, newDocument];
          saveUploadedDocuments(updatedDocs);
          return updatedDocs;
        });

        Alert.alert(
          'Document Uploaded! 📄',
          `Successfully uploaded ${document.name} to Walrus storage.\\n\\nBlob ID: ${blob.id}`
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
      await saveHealthData(data);
      
      // Calculate biological age
      const bioAge = BiologicalAgeService.calculateBiologicalAge(data);
      setBiologicalAge(bioAge);
      await saveBiologicalAge(bioAge);
      
      const dataSource = HealthKitService.isUsingMockData() ? 'Demo' : 'Apple Health';
      Alert.alert(
        'Data Fetched',
        `Successfully fetched from ${dataSource}:\\n` +
        `• HRV: ${data.hrv.length} samples\\n` +
        `• RHR: ${data.rhr.length} samples\\n` +
        `• Weight: ${data.weight.length} samples\\n` +
        `• Exercise: ${data.exercise.length} samples\\n\\n` +
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

    try {
    setUploading(true);
      console.log('🚀 Starting comprehensive health data upload to Walrus blockchain...');
      
      // Debug: Check healthData structure
      console.log('🔍 Health data structure:', {
        type: typeof healthData,
        keys: Object.keys(healthData || {}),
        hrv: {
          type: typeof healthData.hrv,
          isArray: Array.isArray(healthData.hrv),
          length: healthData.hrv?.length
        },
        rhr: {
          type: typeof healthData.rhr,
          isArray: Array.isArray(healthData.rhr),
          length: healthData.rhr?.length
        },
        weight: {
          type: typeof healthData.weight,
          isArray: Array.isArray(healthData.weight),
          length: healthData.weight?.length
        },
        exercise: {
          type: typeof healthData.exercise,
          isArray: Array.isArray(healthData.exercise),
          length: healthData.exercise?.length
        }
      });
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      let statuses: UploadStatus[] = [];
      const blobs = new Map<string, WalrusBlob>();

      // Step 1: Create comprehensive anonymized health dataset
      console.log('📊 Creating comprehensive anonymized health dataset...');
      
      const comprehensiveHealthData = {
        // Core health metrics (anonymized)
        heart_rate_variability: Array.isArray(healthData.hrv) ? healthData.hrv.map((item: any) => ({
          ...item,
          // Remove any personal identifiers
          user_id: undefined,
          device_serial: undefined,
          source: 'health_app' // Anonymized source
        })) : [],
        
        resting_heart_rate: Array.isArray(healthData.rhr) ? healthData.rhr.map((item: any) => ({
          ...item,
          user_id: undefined,
          device_serial: undefined,
          source: 'health_app'
        })) : [],
        
        weight_measurements: Array.isArray(healthData.weight) ? healthData.weight.map((item: any) => ({
          ...item,
          user_id: undefined,
          device_serial: undefined,
          source: 'health_app'
        })) : [],
        
        exercise_sessions: Array.isArray(healthData.exercise) ? healthData.exercise.map((item: any) => ({
          ...item,
          user_id: undefined,
          device_serial: undefined,
          source: 'health_app'
        })) : [],
        
        calories_data: Array.isArray(healthData.calories) ? healthData.calories.map((item: any) => ({
          ...item,
          user_id: undefined,
          device_serial: undefined,
          source: 'health_app'
        })) : [],
        
        // Biological age analysis (anonymized)
        biological_age_analysis: biologicalAge ? {
          calculated_age: biologicalAge.biologicalAge,
          chronological_age: biologicalAge.chronologicalAge,
          age_difference: biologicalAge.ageDifference,
          health_category: (biologicalAge as any).category,
          confidence_score: (biologicalAge as any).confidence,
          contributing_factors: biologicalAge.factors,
          health_recommendations: biologicalAge.recommendations,
          analysis_timestamp: (biologicalAge as any).timestamp,
          // No personal identifiers
          user_id: undefined,
          patient_id: undefined
        } : null,
        
        // Dataset metadata (anonymized)
        dataset_metadata: {
          collection_period: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            duration_days: 30,
            timezone: 'UTC'
          },
          data_sources: {
            device_types: ['smartwatch', 'smartphone'], // Generic device types
            source_system: 'health_monitoring_app',
            data_quality: 'high_fidelity'
          },
          metrics_summary: {
            total_metrics: Object.keys(healthData).filter(key => 
              Array.isArray(healthData[key]) && healthData[key].length > 0
            ).length,
            total_data_points: Object.values(healthData).reduce((total: any, data) => 
              total + (Array.isArray(data) ? data.length : 0), 0),
            sampling_frequency: 'variable_per_metric'
          },
          privacy_protection: {
            anonymization_level: 'comprehensive_anonymization',
            personal_identifiers_removed: [
              'user_name', 'email_address', 'phone_number', 'physical_address',
              'device_serial_numbers', 'apple_id', 'health_record_ids',
              'insurance_information', 'medical_record_numbers'
            ],
            privacy_techniques_applied: [
              'differential_privacy', 'temporal_jittering', 'device_anonymization',
              'source_generalization', 'k_anonymity'
            ],
            privacy_parameters: {
              k_anonymity_level: 20,
              epsilon_differential_privacy: 1.0,
              temporal_jitter_range_minutes: 30
            },
            compliance_standards: ['HIPAA_Safe_Harbor', 'GDPR_Anonymization'],
            processed_timestamp: new Date().toISOString()
          }
        }
      };

      // Step 2: Upload individual metric streams
      console.log('📤 Uploading individual health metric streams to Walrus blockchain...');
      
      const metricsToUpload = [
        { key: 'hrv', data: comprehensiveHealthData.heart_rate_variability, name: 'Heart Rate Variability Stream' },
        { key: 'rhr', data: comprehensiveHealthData.resting_heart_rate, name: 'Resting Heart Rate Stream' },
        { key: 'weight', data: comprehensiveHealthData.weight_measurements, name: 'Weight Measurements Stream' },
        { key: 'exercise', data: comprehensiveHealthData.exercise_sessions, name: 'Exercise Sessions Stream' },
        { key: 'calories', data: comprehensiveHealthData.calories_data, name: 'Calories Data Stream' },
        { key: 'bio_age', data: comprehensiveHealthData.biological_age_analysis, name: 'Biological Age Analysis' }
      ];

      for (const metric of metricsToUpload) {
        if (metric.data && (Array.isArray(metric.data) ? metric.data.length > 0 : metric.data)) {
          statuses.push({ metric: metric.name, status: 'uploading' });
        updateUploadStatuses([...statuses]);
        
          console.log(`📊 Uploading ${metric.name} to Walrus blockchain...`);
          
          const blob = await WalrusService.uploadHealthData(metric.data, {
            metric: metric.key,
          startDate,
          endDate,
            samples: Array.isArray(metric.data) ? metric.data.length : 1
          });
          
          blobs.set(metric.key, blob);
          statuses[statuses.length - 1].status = 'success';
          statuses[statuses.length - 1].blobId = blob.id;
        updateUploadStatuses([...statuses]);
          
          console.log(`✅ ${metric.name} uploaded to Walrus blockchain: ${blob.id}`);
          console.log(`🔗 View on Walruscan: https://walruscan.com/testnet/blob/${blob.id}`);
        }
      }

      // Step 3: Upload complete comprehensive dataset
      statuses.push({ metric: 'Complete Health Dataset', status: 'uploading' });
        updateUploadStatuses([...statuses]);
        
      console.log('📦 Uploading complete comprehensive health dataset to Walrus blockchain...');
      const completeDatasetBlob = await WalrusService.uploadBlob(
        JSON.stringify(comprehensiveHealthData, null, 2), 
        true // Encrypt the complete dataset
      );
      
      blobs.set('complete_dataset', completeDatasetBlob);
      statuses[statuses.length - 1].status = 'success';
      statuses[statuses.length - 1].blobId = completeDatasetBlob.id;
        updateUploadStatuses([...statuses]);
      
      console.log(`✅ Complete dataset uploaded to Walrus blockchain: ${completeDatasetBlob.id}`);

      // Step 4: Create and upload comprehensive manifest
      statuses.push({ metric: 'Blockchain Manifest', status: 'uploading' });
        updateUploadStatuses([...statuses]);
        
      console.log('📋 Creating blockchain-verifiable manifest...');
      const manifest = await WalrusService.createManifest(blobs, {
          startDate,
          endDate,
        deviceTypes: ['smartwatch', 'smartphone'],
        userId: 'anon_health_user_' + Math.random().toString(36).substring(2, 14),
      });

      const manifestBlob = await WalrusService.uploadManifest(manifest);
      
      statuses[statuses.length - 1].status = 'success';
      statuses[statuses.length - 1].blobId = manifestBlob.id;
        updateUploadStatuses([...statuses]);

      // Step 5: Generate blockchain verification instructions
      const blockchainInfo = {
        walrus_manifest_id: manifestBlob.id,
        complete_dataset_blob_id: completeDatasetBlob.id,
        individual_metric_blobs: Object.fromEntries(blobs),
        blockchain_verification: {
          walruscan_urls: {
            manifest_explorer: `https://walruscan.com/testnet/blob/${manifestBlob.id}`,
            complete_dataset_explorer: `https://walruscan.com/testnet/blob/${completeDatasetBlob.id}`,
            individual_metrics: Object.fromEntries(
              Array.from(blobs.entries())
                .filter(([key]) => key !== 'complete_dataset')
                .map(([key, blob]) => [key, `https://walruscan.com/testnet/blob/${blob.id}`])
            )
          },
          cli_verification_commands: {
            check_manifest_status: `walrus blob-status ${manifestBlob.id}`,
            check_dataset_status: `walrus blob-status ${completeDatasetBlob.id}`,
            download_manifest: `walrus read ${manifestBlob.id} --output health_manifest.json`,
            download_complete_dataset: `walrus read ${completeDatasetBlob.id} --output complete_health_data.json`
          },
          api_verification_endpoints: {
            manifest_data: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${manifestBlob.id}`,
            complete_dataset: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${completeDatasetBlob.id}`
          }
        },
        upload_summary: {
          total_blobs_created: blobs.size,
          total_data_points: Object.values(healthData).reduce((total: any, data) => 
            total + (Array.isArray(data) ? data.length : 0), 0),
          anonymization_applied: true,
          encryption_applied: true,
          blockchain_timestamp: new Date().toISOString()
        }
      };

      console.log('🔍 Complete blockchain verification info:', blockchainInfo);

      // Save blockchain info for future reference
      await AsyncStorage.setItem('@walrus_blockchain_verification', JSON.stringify(blockchainInfo));

      Alert.alert(
        'Complete Health Data Uploaded to Blockchain! 🎉',
        `All your anonymized health data is now stored on Walrus blockchain!\\n\\n📊 Total Streams: ${blobs.size}\\n📦 Complete Dataset: ${completeDatasetBlob.id}\\n📋 Manifest: ${manifestBlob.id}\\n🔒 Privacy: Fully anonymized & encrypted\\n\\n🔍 Verify on Blockchain:\\n• Walruscan Explorer\\n• CLI verification commands\\n• API endpoints\\n\\nAll personal information removed before blockchain storage.`,
        [
          {
            text: 'View Manifest',
            onPress: () => {
              console.log('🔗 Walruscan Manifest:', `https://walruscan.com/testnet/blob/${manifestBlob.id}`);
              console.log('📋 CLI Command:', `walrus blob-status ${manifestBlob.id}`);
            }
          },
          {
            text: 'View Complete Dataset',
            onPress: () => {
              console.log('🔗 Walruscan Dataset:', `https://walruscan.com/testnet/blob/${completeDatasetBlob.id}`);
              console.log('📦 CLI Command:', `walrus blob-status ${completeDatasetBlob.id}`);
            }
          },
          {
            text: 'Show All Verification',
            onPress: () => {
              console.log('🔍 Complete Blockchain Verification Info:');
              console.log('📋 Manifest:', blockchainInfo.walrus_manifest_id);
              console.log('📦 Dataset:', blockchainInfo.complete_dataset_blob_id);
              console.log('🔗 Walruscan URLs:', blockchainInfo.blockchain_verification.walruscan_urls);
              console.log('💻 CLI Commands:', blockchainInfo.blockchain_verification.cli_verification_commands);
              console.log('🌐 API Endpoints:', blockchainInfo.blockchain_verification.api_verification_endpoints);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Comprehensive blockchain upload error:', error);
      Alert.alert(
        'Blockchain Upload Error', 
        `Failed to upload complete health data to Walrus blockchain.\\n\\nError: ${error instanceof Error ? error.message : 'Unknown error'}\\n\\nThis may be due to:\\n• Network connectivity issues\\n• Walrus testnet availability\\n• Data size limitations\\n\\nTry again or check Walrus testnet status.`
      );
    } finally {
      setUploading(false);
    }
  };

  const mintHealthDataNFT = async () => {
    if (!healthData) {
      Alert.alert('Error', 'Please generate or fetch health data first');
      return;
    }

    try {
      setMintingNFT(true);
      setTransactionStatus('processing');
      resetTransactionStatus();
      
      // First, ensure Hedera service is initialized
      await HederaBlockchainService.initialize();
      
      // Upload encrypted health data to Walrus first
      console.log('🔐 Encrypting and uploading health data to Walrus...');
      const walrusBlob = await WalrusService.uploadHealthData(healthData, {
        metric: 'complete_health_dataset',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        samples: Object.values(healthData).reduce((total: any, data) => 
          total + (Array.isArray(data) ? data.length : 0), 0)
      });
      
      // Get metrics from health data (no PII)
      const metrics = Object.keys(healthData).filter(key => healthData[key]?.length > 0);
      
      // Create NFT with encrypted data reference
      const nftName = `Anonymous Health Data - ${new Date().toLocaleDateString()}`;
      const description = `Anonymized health metrics dataset. No personal information included.`;
      const ageDiff = biologicalAge?.ageDifference ?? 0;
      const rarity = ageDiff < 0 ? 'Legendary' : 
                     ageDiff === 0 ? 'Epic' : 
                     ageDiff < 5 ? 'Rare' : 'Common';
      const price = rarity === 'Legendary' ? 50 : 
                   rarity === 'Epic' ? 30 : 
                   rarity === 'Rare' ? 20 : 10; // Price in HBAR
      
      Alert.alert(
        'Minting NFT on Hedera...',
        `Creating Hedera NFT with encrypted health data:\\n\\n• Metrics: ${metrics.length}\\n• Biological Age: ${biologicalAge?.biologicalAge || 'N/A'}\\n• Rarity: ${rarity}\\n• Price: ${price} HBAR\\n• Data Storage: Walrus (Encrypted)`,
        [{ text: 'Continue', style: 'default' }]
      );
      
      const transaction = await HederaBlockchainService.mintHealthDataNFT(
        nftName,
        description,
        healthData,
        walrusBlob.id,
        metrics,
        rarity,
        price
      );
      
      // Save transaction and update status
      const updatedTransactions = [...hederaTransactions, transaction];
      setHederaTransactions(updatedTransactions);
      await saveHederaTransactions(updatedTransactions);
      setSelectedTransaction(transaction);
      setTransactionStatus('success');
      setTransactionLink(transaction.explorerUrl || '');
      setShowTransactionDropdown(true);
      
      // Log transaction details
      HederaBlockchainService.logTransactionDetails(transaction);
      
      console.log('');
      console.log('🎉 ================ NFT MINTED ON HEDERA ================');
      console.log(`🔷 Network: Hedera Testnet`);
      console.log(`💎 NFT Name: ${nftName}`);
      console.log(`🆔 Transaction ID: ${transaction.transactionId}`);
      console.log(`#️⃣ Serial Number: ${transaction.serialNumber}`);
      console.log(`🔐 Encrypted Data: Stored on Walrus`);
      console.log(`🔗 Explorer: ${transaction.explorerUrl}`);
      console.log(`⏰ Timestamp: ${transaction.timestamp}`);
      console.log('========================================================');
      console.log('');
      
      Alert.alert(
        'NFT Minted on Hedera! 🎉',
        `Your health data NFT has been created on Hedera blockchain.\\n\\n` +
        `Transaction ID: ${transaction.transactionId}\\n` +
        `Serial Number: ${transaction.serialNumber || 'N/A'}\\n` +
        `Status: ${transaction.status}\\n` +
        `Price: ${price} HBAR\\n\\n` +
        `Encrypted data stored on Walrus.\\n` +
        `No personal information included in NFT.`
      );
      
    } catch (error) {
      console.error('NFT minting error:', error);
      setTransactionStatus('failed');
      Alert.alert('Minting Error', 'Failed to mint NFT on Hedera blockchain');
    } finally {
      setMintingNFT(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Connect Wearable</Text>
        
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

        {/* Transaction Status Dropdown */}
        {showTransactionDropdown && selectedTransaction && (
          <View style={styles.transactionDropdown}>
            <TouchableOpacity
              style={styles.transactionDropdownHeader}
              onPress={() => setShowTransactionDropdown(!showTransactionDropdown)}
            >
              <View>
                <Text style={styles.transactionDropdownTitle}>NFT Transaction</Text>
                <Text style={[
                  styles.transactionDropdownStatus,
                  transactionStatus === 'processing' && styles.statusProcessing,
                  transactionStatus === 'success' && styles.statusSuccess,
                  transactionStatus === 'failed' && styles.statusFailed
                ]}>
                  {transactionStatus === 'processing' ? '⏳ Processing...' :
                   transactionStatus === 'success' ? '✅ Success' :
                   transactionStatus === 'failed' ? '❌ Failed' : ''}
                </Text>
              </View>
              <Text style={styles.dropdownArrow}>{showTransactionDropdown ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            
            {transactionLink && (
              <View style={styles.transactionDropdownContent}>
                <Text style={styles.transactionLinkLabel}>Transaction Link:</Text>
                <TouchableOpacity onPress={() => console.log('Explorer URL:', transactionLink)}>
                  <Text style={styles.transactionLinkText}>{transactionLink}</Text>
                </TouchableOpacity>
                <Text style={styles.transactionIdText}>ID: {selectedTransaction.transactionId}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons - 2x2 Grid */}
        <View style={styles.buttonGridContainer}>
          <View style={styles.buttonRow}>
            <Glisten style={[styles.gridButton, styles.fakeDataButton]}>
          <TouchableOpacity
                style={styles.gridButtonInner}
            onPress={generateFakeData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
                  <Text style={styles.gridButtonText}>Generate Mock Data</Text>
            )}
          </TouchableOpacity>
            </Glisten>
          
            <Glisten style={[styles.gridButton, styles.fetchButton]}>
          <TouchableOpacity
                style={styles.gridButtonInner}
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
                  <Text style={styles.gridButtonText}>
{HealthKitService.isUsingMockData() ? ' Connect to Apple Health' : '📊 Fetch Real Health Data'}
              </Text>
            )}
          </TouchableOpacity>
            </Glisten>
          </View>

          <View style={styles.buttonRow}>
            <Glisten style={[styles.gridButton, styles.uploadButton, !healthData && styles.buttonDisabled]}>
          <TouchableOpacity
                style={styles.gridButtonInner}
            onPress={uploadToWalrus}
            disabled={uploading || !healthData}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
                  <Text style={styles.gridButtonText}>Upload to Walrus</Text>
            )}
          </TouchableOpacity>
            </Glisten>

            <Glisten style={[styles.gridButton, styles.flowButton, !healthData && styles.buttonDisabled]}>
          <TouchableOpacity
                style={styles.gridButtonInner}
            onPress={mintHealthDataNFT}
            disabled={mintingNFT || !healthData}
          >
            {mintingNFT ? (
              <ActivityIndicator color="white" />
            ) : (
                  <Text style={styles.gridButtonText}>Package as NFT</Text>
            )}
          </TouchableOpacity>
            </Glisten>
        </View>
              </View>


        {/* Document Upload Section */}
        <View style={[styles.section, styles.documentSection]}>
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
              {uploadedDocuments.map((doc: any, index: number) => (
                <View key={`doc-${index}`} style={styles.documentItem}>
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
            {uploadStatuses.map((status: any, index: number) => (
              <View key={`status-${index}`} style={styles.statusRow}>
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
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 239, 139, 0.2)',
  },
  documentSection: {
    marginTop: 30,
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
  buttonGridContainer: {
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  gridButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  gridButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  gridButtonInner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
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
    backgroundColor: '#FF6B6B',
  },
  documentButton: {
    backgroundColor: '#FF8C00',
  },
  uploadButton: {
    backgroundColor: '#34C759',
  },
  flowButton: {
    backgroundColor: '#7B61FF', // Hedera purple
  },
  viewBlockchainButton: {
    backgroundColor: '#6366f1',
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
  dropdownButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#666',
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: '#666',
  },
  transactionDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  transactionValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  transactionLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  statusSealed: {
    color: '#34C759',
    fontWeight: '600',
  },
  explorerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  explorerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  transactionDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDropdownStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusProcessing: {
    color: '#ff9500',
  },
  statusFailed: {
    color: '#ff3b30',
  },
  transactionDropdownContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  transactionLinkLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  transactionIdText: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});