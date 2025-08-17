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
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalrusService, { WalrusBlob } from '../services/walrus';
import HederaBlockchainService, { HederaTransaction } from '../services/hederaBlockchainSimple';

// Storage keys for persistence
const STORAGE_KEYS = {
  UPLOADED_DOCUMENTS: '@fitcentive_uploaded_documents',
  UPLOAD_STATUSES: '@fitcentive_upload_statuses',
};

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
      `Unable to open the Flow explorer. Please visit manually:\n\n${url}`,
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

export default function UploadScreen() {
  const navigation = useNavigation();
  const [uploading, setUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [hederaTransactionId, setHederaTransactionId] = useState<string | null>(null);

  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      console.log('📱 [STORAGE] Loading persisted upload data...');
      
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

    } catch (error) {
      console.error('❌ [STORAGE] Error loading persisted upload data:', error);
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

  const updateUploadStatuses = (newStatuses: UploadStatus[]) => {
    setUploadStatuses(newStatuses);
    saveUploadStatuses(newStatuses);
  };

  const navigateToAskAI = (question: string) => {
    (navigation as any).navigate('Ask', { 
      initialQuestion: question 
    });
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
          'Document Uploaded',
          `Successfully uploaded ${document.name} to Walrus storage.\n\nBlob ID: ${blob.id}`
        );
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload document');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload</Text>
        </View>
        
        {/* Document Upload Section */}
        <View style={[styles.section, styles.documentSection]}>
          <Text style={styles.sectionTitle}>Upload Medical Documents</Text>
          <Text style={styles.sectionSubtitle}>PDF, DOC, TXT, etc.</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.documentButton]}
            onPress={uploadDocument}
          >
            <Text style={styles.buttonText}>Upload Document</Text>
          </TouchableOpacity>

          {uploadedDocuments.length > 0 && (
            <View style={styles.documentsContainer}>
              <Text style={styles.documentsTitle}>Uploaded Documents:</Text>
              {uploadedDocuments.map((doc: any, index: number) => (
                <View key={`doc-${index}`}>
                  <View style={styles.documentItem}>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentSize}>
                      {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.documentStatus}>✓</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.askAIButton}
                    onPress={() => navigateToAskAI(`Please explain this document to me: ${doc.name}. Analyze the content and provide insights based on the health data available.`)}
                  >
                    <Text style={styles.askAIButtonText}>Ask AI</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Hedera Transaction Link */}
        {hederaTransactionId && (
          <View style={styles.transactionContainer}>
            <Text style={styles.transactionLabel}>Hedera Testnet Transaction:</Text>
            <TouchableOpacity
              style={styles.transactionButton}
              onPress={() => openExternal(`https://hashscan.io/testnet/transaction/${hederaTransactionId}`)}
            >
              <Text style={styles.transactionText}>{hederaTransactionId}</Text>
              <Text style={styles.transactionSubtext}>Tap to view on HashScan Explorer</Text>
            </TouchableOpacity>
          </View>
        )}

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
        
        <Text style={styles.poweredByText}>Powered by Walrus & Seal</Text>
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
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
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
    marginTop: 0,
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
  askAIButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  askAIButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  documentButton: {
    backgroundColor: '#FF8C00',
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
  transactionContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  transactionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  transactionText: {
    fontSize: 12,
    fontFamily: 'Menlo',
    color: '#007AFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  transactionSubtext: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  poweredByText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
});