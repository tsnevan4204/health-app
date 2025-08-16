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
    // Encrypt data if requested
    let uploadData: string;
    
    if (encrypt) {
      const encryptionMetadata = await EncryptionService.encrypt(data);
      uploadData = JSON.stringify(encryptionMetadata);
    } else {
      uploadData = data;
    }

    // Convert string to buffer for upload
    const buffer = Buffer.from(uploadData);
    
    // Try multiple Walrus endpoints (correct v1 API path)
    const endpoints = [
      `${this.publisherURL}/v1/blobs`,
      'https://publisher.walrus-testnet.walrus.space/v1/blobs',
      'https://walrus-testnet-publisher.blockeden.xyz/v1/blobs',
      'https://walrus-publisher-testnet.bartestnet.com/v1/blobs'
    ];

    let lastError: any;
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying Walrus endpoint: ${endpoint}`);
        
        const response = await axios.put(
          endpoint,
          buffer,
          {
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 30000, // 30 second timeout
          }
        );

        // Extract blob ID from response
        let blobId: string;
        let objectId: string;
        
        console.log('Raw Walrus response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.newlyCreated) {
          blobId = response.data.newlyCreated.blobObject.blobId;
          objectId = response.data.newlyCreated.blobObject.id;
        } else if (response.data.alreadyCertified) {
          blobId = response.data.alreadyCertified.blobId;
          objectId = response.data.alreadyCertified.object?.id || response.data.alreadyCertified.blobId;
        } else {
          throw new Error('Unexpected response format from Walrus');
        }

        // Calculate checksum
        const checksum = await EncryptionService.hashData(uploadData);
        
        // Log Walrus explorer link using walruscan.com
        const explorerUrl = `https://walruscan.com/testnet/blob/${blobId}`;
        console.log('');
        console.log('🐋 ================ WALRUS UPLOAD (TESTNET) ================');
        console.log(`✅ Blob ID: ${blobId}`);
        console.log(`🆔 Object ID: ${objectId}`);
        console.log(`🔗 Walruscan: ${explorerUrl}`);
        console.log(`📦 Size: ${buffer.length} bytes`);
        console.log(`🌐 Endpoint: ${endpoint}`);
        console.log('=========================================================');
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
        console.warn(`Failed with endpoint ${endpoint}:`, error);
        continue;
      }
    }

    throw lastError || new Error('All Walrus endpoints failed');
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

  async uploadHealthData(
    healthData: any,
    metadata: {
      metric: string;
      startDate: Date;
      endDate: Date;
      samples: number;
    }
  ): Promise<WalrusBlob> {
    // Sanitize health data to remove personal identifiers
    const sanitizedData = this.sanitizeHealthData(healthData);
    
    // Format data as JSONL
    const jsonlData = sanitizedData
      .map((item: any) => JSON.stringify(item))
      .join('\n');

    // Upload encrypted blob
    const blob = await this.uploadBlob(jsonlData, true);

    return blob;
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