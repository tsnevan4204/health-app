import axios from 'axios';
import { Buffer } from 'buffer';
import EncryptionService, { EncryptedData } from './encryption';

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
  private apiKey: string;

  constructor() {
    // These would come from env vars in production
    this.baseURL = process.env.WALRUS_API_URL || 'https://walrus-testnet.example.com';
    this.apiKey = process.env.WALRUS_API_KEY || '';
  }

  async uploadBlob(data: string, encrypt: boolean = true): Promise<WalrusBlob> {
    try {
      // Encrypt data if requested
      let uploadData: string;
      let encryptionMetadata: EncryptedData | null = null;
      
      if (encrypt) {
        encryptionMetadata = await EncryptionService.encrypt(data);
        uploadData = JSON.stringify(encryptionMetadata);
      } else {
        uploadData = data;
      }

      // Convert to buffer for upload
      const buffer = Buffer.from(uploadData);
      
      // Upload to Walrus
      const response = await axios.post(
        `${this.baseURL}/api/v1/store`,
        buffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-API-Key': this.apiKey,
          },
        }
      );

      const blobId = response.data.blob_id;
      const checksum = await EncryptionService.hashData(uploadData);

      return {
        id: blobId,
        url: `walrus://blob/${blobId}`,
        checksum,
        size: buffer.length,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Walrus upload error:', error);
      throw new Error('Failed to upload to Walrus storage');
    }
  }

  async downloadBlob(blobId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/retrieve/${blobId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
          responseType: 'text',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Walrus download error:', error);
      throw new Error('Failed to download from Walrus storage');
    }
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
    // Format data as JSONL
    const jsonlData = healthData
      .map((item: any) => JSON.stringify(item))
      .join('\n');

    // Upload encrypted blob
    const blob = await this.uploadBlob(jsonlData, true);

    console.log(`Uploaded ${metadata.metric} data: ${blob.id}`);
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
    const manifest: DatasetManifest = {
      schema_version: '1.0',
      dataset_id: EncryptionService.generateManifestId(),
      user_pseudonymous_id: metadata.userId,
      title: '30-Day Health Metrics Bundle',
      description: 'Comprehensive biometric data including HRV, heart rate, and activity metrics',
      metrics: {},
      time_range: {
        start: metadata.startDate.toISOString(),
        end: metadata.endDate.toISOString(),
        timezone: 'UTC',
      },
      device_types: metadata.deviceTypes,
      anonymization: {
        method: 'differential_privacy',
        epsilon: 1.0,
        k_anonymity: 20,
        removed_fields: ['exact_location', 'device_id', 'user_id'],
        time_granularity: 'hour',
        noise_added: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

    // Add metrics to manifest
    for (const [metric, blob] of blobs.entries()) {
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
    
    console.log(`Uploaded manifest: ${blob.id}`);
    return blob;
  }

  // Simulate Walrus storage for testing without actual network
  async simulateUpload(data: string): Promise<WalrusBlob> {
    const blobId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checksum = await EncryptionService.hashData(data);
    
    // Store in AsyncStorage for testing
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem(`walrus_${blobId}`, data);
    
    return {
      id: blobId,
      url: `walrus://blob/${blobId}`,
      checksum,
      size: Buffer.from(data).length,
      createdAt: new Date().toISOString(),
    };
  }
}

export default new WalrusService();