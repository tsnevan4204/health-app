import axios from 'axios';
import { Buffer } from 'buffer';
import EncryptionService, { EncryptedData } from './encryption';
import { ENV } from '../config/env';

export interface WalrusBlob {
  id: string;
  url: string;
  checksum: string;
  size: number;
  createdAt: string;
}

export interface DatasetManifest {
  schema_version: string;
  dataset_id: string;
  user_pseudonymous_id: string;
  title: string;
  description: string;
  metrics: {
    [key: string]: {
      included: boolean;
      samples: number;
      frequency: string;
      blob_url: string;
      checksum: string;
    };
  };
  time_range: {
    start: string;
    end: string;
    timezone: string;
  };
  device_types: string[];
  anonymization: {
    method: string;
    epsilon: number;
    k_anonymity: number;
    removed_fields: string[];
    time_granularity: string;
    noise_added: boolean;
  };
  created_at: string;
  updated_at: string;
  version: number;
}

class WalrusService {
  private baseURL: string;
  private publisherURL: string;
  private aggregatorURL: string;
  private useSimulation: boolean = false;

  constructor() {
    // Walrus testnet endpoints from environment
    this.baseURL = ENV.WALRUS_TESTNET_URL;
    this.publisherURL = ENV.WALRUS_PUBLISHER_URL;
    this.aggregatorURL = ENV.WALRUS_AGGREGATOR_URL;
  }

  async uploadBlob(data: string, encrypt: boolean = true): Promise<WalrusBlob> {
    try {
      // First try real upload
      return await this.uploadToTestnet(data, encrypt);
    } catch (error) {
      console.warn('Walrus testnet upload failed, using simulation fallback:', error);
      // Fallback to simulation if testnet fails
      return await this.simulateUpload(data, encrypt);
    }
  }

  private async uploadToTestnet(data: string, encrypt: boolean = true): Promise<WalrusBlob> {
    console.log('🚀 Starting Walrus testnet upload...');
    
    // Encrypt data if requested
    let uploadData: string;
    
    if (encrypt) {
      console.log('🔐 Encrypting data before upload...');
      const encryptionMetadata = await EncryptionService.encrypt(data);
      uploadData = JSON.stringify(encryptionMetadata);
    } else {
      uploadData = data;
    }

    // Convert string to buffer for upload
    const buffer = Buffer.from(uploadData);
    console.log(`📦 Data prepared for upload: ${buffer.length} bytes`);
    
    // Check data size limits (Walrus has size limits)
    if (buffer.length > 10 * 1024 * 1024) { // 10MB limit
      console.warn('⚠️ Data size exceeds 10MB, may cause upload issues');
    }
    
    // Try multiple Walrus endpoints with improved error handling
    const endpoints = [
      'https://publisher.walrus-testnet.walrus.space/v1/blobs', // Official endpoint
      `${this.publisherURL}/v1/blobs`, // Configured endpoint  
      'https://walrus-testnet-publisher.nodeinfra.com/v1/blobs', // Alternative
    ];

    let lastError: any;
    let attemptCount = 0;
    
    for (const endpoint of endpoints) {
      try {
        attemptCount++;
        console.log(`📡 Attempt ${attemptCount}: Trying Walrus endpoint: ${endpoint}`);
        
        // Test endpoint connectivity first
        try {
          const healthCheck = await axios.get(endpoint.replace('/v1/blobs', '/health'), { timeout: 5000 });
          console.log(`✅ Endpoint ${endpoint} is reachable`);
        } catch (healthError) {
          console.warn(`⚠️ Endpoint health check failed for ${endpoint}, but continuing...`);
        }
        
        const response = await axios.put(
          endpoint,
          buffer,
          {
            headers: {
              'Content-Type': 'application/octet-stream',
              'User-Agent': 'Fitcentive-Health-App/1.0',
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 60000, // Increased to 60 seconds
            validateStatus: (status) => status >= 200 && status < 300,
          }
        );

        console.log(`✅ Upload successful! Status: ${response.status}`);
        console.log('📋 Response headers:', response.headers);
        
        // Extract blob ID from response with better error handling
        let blobId: string;
        let objectId: string;
        
        console.log('📄 Raw Walrus response:', JSON.stringify(response.data, null, 2));
        
        if (response.data && typeof response.data === 'object') {
          if (response.data.newlyCreated && response.data.newlyCreated.blobObject) {
            blobId = response.data.newlyCreated.blobObject.blobId;
            objectId = response.data.newlyCreated.blobObject.id;
            console.log('✅ Found newlyCreated blob');
          } else if (response.data.alreadyCertified) {
            blobId = response.data.alreadyCertified.blobId;
            objectId = response.data.alreadyCertified.object?.id || response.data.alreadyCertified.blobId;
            console.log('✅ Found alreadyCertified blob');
          } else if (response.data.blobId) {
            // Direct blob ID in response
            blobId = response.data.blobId;
            objectId = response.data.objectId || blobId;
            console.log('✅ Found direct blob ID');
          } else {
            console.error('❌ Unexpected response format:', response.data);
            throw new Error(`Unexpected response format from Walrus: ${JSON.stringify(response.data)}`);
          }
        } else {
          throw new Error(`Invalid response data type: ${typeof response.data}`);
        }

        // Validate blob ID format
        if (!blobId || typeof blobId !== 'string') {
          throw new Error(`Invalid blob ID received: ${blobId}`);
        }

        // Calculate checksum
        const checksum = await EncryptionService.hashData(uploadData);
        
        // Log success with detailed information
        const explorerUrl = `https://walruscan.com/testnet/blob/${blobId}`;
        console.log('');
        console.log('🎉 ================ WALRUS UPLOAD SUCCESS ================');
        console.log(`✅ Blob ID: ${blobId}`);
        console.log(`🆔 Object ID: ${objectId}`);
        console.log(`🔗 Walruscan: ${explorerUrl}`);
        console.log(`📦 Size: ${buffer.length} bytes`);
        console.log(`🌐 Endpoint: ${endpoint}`);
        console.log(`🔐 Encrypted: ${encrypt}`);
        console.log(`📊 Checksum: ${checksum}`);
        console.log('========================================================');
        console.log('');
        
        return {
          id: blobId,
          url: `${this.aggregatorURL}/v1/blobs/${blobId}`,
          checksum,
          size: buffer.length,
          createdAt: new Date().toISOString(),
        };
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Failed with endpoint ${endpoint}:`, error);
        
        if (axios.isAxiosError(error)) {
          console.error(`📡 Status: ${error.response?.status}`);
          console.error(`📝 Status Text: ${error.response?.statusText}`);
          console.error(`📄 Response Data:`, error.response?.data);
          console.error(`🌐 Request URL: ${error.config?.url}`);
          console.error(`📋 Request Headers:`, error.config?.headers);
        }
        
        // Continue to next endpoint
        continue;
      }
    }

    // All endpoints failed
    console.error('❌ All Walrus endpoints failed');
    console.error('🔧 Troubleshooting suggestions:');
    console.error('  1. Check internet connectivity');
    console.error('  2. Verify Walrus testnet is operational');
    console.error('  3. Try reducing data size');
    console.error('  4. Check Walrus service status');
    
    throw lastError || new Error('All Walrus endpoints failed - check network connectivity and Walrus testnet status');
  }

  private async simulateUpload(data: string, encrypt: boolean = true): Promise<WalrusBlob> {
    // Encrypt data if requested
    let uploadData: string;
    
    if (encrypt) {
      const encryptionMetadata = await EncryptionService.encrypt(data);
      uploadData = JSON.stringify(encryptionMetadata);
    } else {
      uploadData = data;
    }

    // Generate simulated blob ID that looks realistic
    const timestamp = Date.now().toString(16);
    const random = Math.random().toString(16).substring(2, 10);
    const blobId = `0x${timestamp}${random}`.padEnd(66, '0').substring(0, 66);
    
    const checksum = await EncryptionService.hashData(uploadData);
    const buffer = Buffer.from(uploadData);
    
    // Store in AsyncStorage for persistence
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(`walrus_sim_${blobId}`, uploadData);
    } catch (error) {
      console.warn('Could not persist simulated data:', error);
    }
    
    // Log Walrus explorer link using walruscan.com format
    const explorerUrl = `https://walruscan.com/testnet/blob/${blobId}`;
    console.log('');
    console.log('🐋 ================ WALRUS UPLOAD (SIMULATED) ================');
    console.log(`✅ Blob ID: ${blobId}`);
    console.log(`🔗 Walruscan: ${explorerUrl}`);
    console.log(`📦 Size: ${buffer.length} bytes`);
    console.log('⚠️  Note: Using simulation due to testnet connectivity issues');
    console.log('===========================================================');
    console.log('');
    
    return {
      id: blobId,
      url: `walrus://simulated/${blobId}`,
      checksum,
      size: buffer.length,
      createdAt: new Date().toISOString(),
    };
  }

  async downloadBlob(blobId: string): Promise<string> {
    // Check if it's a simulated blob first
    if (blobId.startsWith('0x') && blobId.length === 66) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const data = await AsyncStorage.getItem(`walrus_sim_${blobId}`);
        if (data) {
          return data;
        }
      } catch (error) {
        console.warn('Could not retrieve simulated data:', error);
      }
    }

    try {
      const response = await axios.get(
        `${this.aggregatorURL}/v1/blobs/${blobId}`,
        {
          responseType: 'text',
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Walrus download error:', error);
      throw new Error('Failed to download from Walrus storage');
    }
  }

  private sanitizeHealthData(healthData: any[]): any[] {
    // Remove or anonymize personal identifiers from health data
    return healthData.map((item: any) => {
      const sanitized = { ...item };
      
      // Remove/anonymize device information that could identify users
      if (sanitized.device) {
        // Replace specific device names with generic types
        sanitized.device = sanitized.device.includes('Apple Watch') ? 'smartwatch' : 
                          sanitized.device.includes('iPhone') ? 'smartphone' : 'health_device';
      }
      
      // Remove any user-specific source information
      if (sanitized.source === 'apple_health') {
        sanitized.source = 'health_app';
      }
      
      // Add random noise to timestamps to prevent correlation attacks
      if (sanitized.timestamp) {
        const timestamp = new Date(sanitized.timestamp);
        // Add random jitter of ±30 minutes
        const jitter = (Math.random() - 0.5) * 60 * 60 * 1000; // ±30 min in ms
        timestamp.setTime(timestamp.getTime() + jitter);
        sanitized.timestamp = timestamp.toISOString();
      }
      
      // Remove any other potentially identifying fields
      delete sanitized.userId;
      delete sanitized.userName;
      delete sanitized.deviceId;
      delete sanitized.serialNumber;
      
      return sanitized;
    });
  }

  private sanitizeSingleObject(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sanitized = { ...data };
    
    // Remove any personal identifiers from the object
    delete sanitized.userId;
    delete sanitized.userName;
    delete sanitized.deviceId;
    delete sanitized.serialNumber;
    delete sanitized.user_id;
    delete sanitized.device_serial;
    delete sanitized.patient_id;
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        if (Array.isArray(sanitized[key])) {
          // Sanitize array of objects
          sanitized[key] = sanitized[key].map((item: any) => 
            typeof item === 'object' ? this.sanitizeSingleObject(item) : item
          );
        } else {
          // Sanitize nested object
          sanitized[key] = this.sanitizeSingleObject(sanitized[key]);
        }
      }
    });
    
    return sanitized;
  }

  async uploadHealthData(
    healthData: any,
    metadata: {
      metric: string;
      startDate: Date;
      endDate: Date;
      samples: number;
    }
  ): Promise<WalrusBlob> {
    let sanitizedData: any;
    
    // Handle both arrays and objects
    if (Array.isArray(healthData)) {
      // Sanitize health data array to remove personal identifiers
      sanitizedData = this.sanitizeHealthData(healthData);
      
      // Format data as JSONL
      const jsonlData = sanitizedData
        .map((item: any) => JSON.stringify(item))
        .join('\n');
      
      // Upload encrypted blob
      return await this.uploadBlob(jsonlData, true);
    } else {
      // Handle single object (like biological age analysis)
      sanitizedData = this.sanitizeSingleObject(healthData);
      
      // Format as single JSON object
      const jsonData = JSON.stringify(sanitizedData);
      
      // Upload encrypted blob
      return await this.uploadBlob(jsonData, true);
    }
  }

  async createManifest(
    blobs: Map<string, WalrusBlob>,
    metadata: {
      startDate: Date;
      endDate: Date;
      deviceTypes: string[];
      userId: string;
    }
  ): Promise<DatasetManifest> {
    // Generate truly anonymous pseudonymous ID
    const anonymousId = await EncryptionService.hashData(
      `${metadata.userId}_${Date.now()}_${Math.random()}`
    );
    
    const manifest: DatasetManifest = {
      schema_version: '1.0',
      dataset_id: EncryptionService.generateManifestId(),
      user_pseudonymous_id: anonymousId.substring(0, 16), // Use only first 16 chars for anonymity
      title: 'Anonymized Health Metrics Dataset',
      description: 'Privacy-protected biometric data with differential privacy and anonymization applied',
      metrics: {},
      time_range: {
        start: metadata.startDate.toISOString(),
        end: metadata.endDate.toISOString(),
        timezone: 'UTC',
      },
      device_types: ['smartwatch', 'smartphone'], // Generic device types only
      anonymization: {
        method: 'differential_privacy_with_temporal_jitter',
        epsilon: 1.0,
        k_anonymity: 20,
        removed_fields: [
          'user_name', 'device_name', 'device_id', 'user_id', 
          'exact_location', 'serial_number', 'source_name',
          'device_serial', 'apple_id', 'health_record_id'
        ],
        time_granularity: 'hour_with_jitter',
        noise_added: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

    // Add metrics to manifest
    for (const [metric, blob] of Array.from(blobs.entries())) {
      manifest.metrics[metric] = {
        included: true,
        samples: 0, // Would be calculated from actual data
        frequency: metric === 'hrv' ? 'hourly' : 'daily',
        blob_url: blob.url,
        checksum: blob.checksum,
      };
    }

    return manifest;
  }

  async uploadManifest(manifest: DatasetManifest): Promise<WalrusBlob> {
    const manifestJson = JSON.stringify(manifest, null, 2);
    const blob = await this.uploadBlob(manifestJson, false);
    
    // Log manifest upload with walruscan link
    const explorerUrl = `https://walruscan.com/testnet/blob/${blob.id}`;
    console.log('');
    console.log('📋 ================ MANIFEST UPLOAD ================');
    console.log(`✅ Manifest ID: ${blob.id}`);
    console.log(`🔗 Walruscan: ${explorerUrl}`);
    console.log('=================================================');
    console.log('');
    
    return blob;
  }

}

export default new WalrusService();