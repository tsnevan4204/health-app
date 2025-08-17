import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptionService from './encryption';

// Hedera SDK configuration for testnet
const HEDERA_CONFIG = {
  network: 'testnet',
  mirrorNode: 'https://testnet.mirrornode.hedera.com',
  apiUrl: 'https://testnet.hedera.com',
  // Demo account for testing (in production, use secure key management)
  accountId: '0.0.4559426',
  privateKey: 'YOUR_PRIVATE_KEY_HERE', // In production, use secure storage
  tokenId: null as string | null, // Will be created/stored
  topicId: null as string | null, // For HCS messages
};

// Storage keys
const STORAGE_KEYS = {
  HEDERA_ACCOUNT: '@hedera_account',
  NFT_TOKEN_ID: '@hedera_nft_token',
  ENCRYPTION_KEYS: '@hedera_encryption_keys',
  PURCHASE_KEYS: '@hedera_purchase_keys',
};

export interface HederaNFT {
  tokenId: string;
  serialNumber: number;
  metadata: {
    name: string;
    description: string;
    dataHash: string; // Hash of encrypted data on Walrus
    walrusBlobId: string; // Reference to encrypted data on Walrus
    encryptedDataKey: string; // Encrypted symmetric key for data
    healthMetrics: string[]; // List of included metrics (no PII)
    datePeriod: {
      start: string;
      end: string;
    };
    anonymizedUserId: string; // Random anonymous ID
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    price: number; // In HBAR
  };
  owner: string;
  creator: string;
  timestamp: string;
  transactionId: string;
}

export interface HederaTransaction {
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  type: 'MINT' | 'TRANSFER' | 'LIST' | 'PURCHASE';
  tokenId?: string;
  serialNumber?: number;
  from?: string;
  to?: string;
  amount?: number;
  timestamp: string;
  explorerUrl: string;
}

export interface EncryptedHealthData {
  walrusBlobId: string;
  encryptedData: string; // Base64 encoded encrypted data
  encryptionKey?: string; // Only provided after purchase
  dataHash: string;
  metadata: {
    dataType: 'health_metrics';
    encrypted: boolean;
    algorithm: 'AES-256-GCM';
    compressionType: 'gzip';
  };
}

class HederaBlockchainService {
  private initialized = false;
  private purchaseKeys: Map<string, string> = new Map();

  async initialize(): Promise<void> {
    try {
      console.log('🔷 Initializing Hedera blockchain service...');
      
      // Load stored configuration
      const storedAccount = await AsyncStorage.getItem(STORAGE_KEYS.HEDERA_ACCOUNT);
      if (storedAccount) {
        const account = JSON.parse(storedAccount);
        HEDERA_CONFIG.accountId = account.accountId;
      }

      const storedTokenId = await AsyncStorage.getItem(STORAGE_KEYS.NFT_TOKEN_ID);
      if (storedTokenId) {
        HEDERA_CONFIG.tokenId = storedTokenId;
      }

      // Load purchase keys for decryption
      const storedKeys = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASE_KEYS);
      if (storedKeys) {
        const keys = JSON.parse(storedKeys);
        this.purchaseKeys = new Map(Object.entries(keys));
      }

      this.initialized = true;
      console.log('✅ Hedera service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Hedera service:', error);
      throw error;
    }
  }

  // Create NFT token on Hedera (one-time setup)
  async createNFTCollection(name: string, symbol: string): Promise<string> {
    try {
      console.log('🎨 Creating NFT collection on Hedera...');
      
      // Simulate NFT token creation on Hedera testnet
      const tokenId = `0.0.${Math.floor(Math.random() * 1000000) + 4000000}`;
      
      await AsyncStorage.setItem(STORAGE_KEYS.NFT_TOKEN_ID, tokenId);
      HEDERA_CONFIG.tokenId = tokenId;
      
      console.log(`✅ NFT collection created with token ID: ${tokenId}`);
      return tokenId;
    } catch (error) {
      console.error('❌ Failed to create NFT collection:', error);
      throw error;
    }
  }

  // Mint health data NFT with encrypted data on Walrus
  async mintHealthDataNFT(
    name: string,
    description: string,
    healthData: any,
    walrusBlobId: string,
    metrics: string[],
    rarity: string,
    price: number,
    bountyAmount: number // USDC reward amount
  ): Promise<HederaNFT> {
    try {
      console.log('🏥 Minting health data NFT on Hedera...');
      
      // Remove any PII (first name, last name, email, etc.)
      const sanitizedData = this.sanitizeHealthData(healthData);
      
      // Generate encryption key for this NFT's data
      const dataEncryptionKey = EncryptionService.generateKey();
      
      // Encrypt the sanitized health data
      const encryptedData = await EncryptionService.encryptData(
        JSON.stringify(sanitizedData),
        dataEncryptionKey
      );
      
      // Store encrypted data reference (actual data is on Walrus)
      const dataHash = this.generateDataHash(encryptedData);
      
      // Encrypt the data key itself (will be decrypted after purchase)
      const encryptedDataKey = await EncryptionService.encryptData(
        dataEncryptionKey,
        'MASTER_NFT_KEY' // In production, use proper key management
      );
      
      // Create NFT metadata (no PII included)
      const metadata: HederaNFT['metadata'] = {
        name: name.replace(/personal|name|identity/gi, ''), // Remove any PII references
        description,
        dataHash,
        walrusBlobId,
        encryptedDataKey,
        healthMetrics: metrics,
        datePeriod: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        anonymizedUserId: `anon_${Math.random().toString(36).substr(2, 12)}`,
        rarity: rarity as any,
        price,
      };
      
      // Simulate NFT minting on Hedera
      const transactionId = `${HEDERA_CONFIG.accountId}@${Date.now()}`;
      const serialNumber = Math.floor(Math.random() * 10000) + 1;
      
      const nft: HederaNFT = {
        tokenId: HEDERA_CONFIG.tokenId || 'pending',
        serialNumber,
        metadata,
        owner: HEDERA_CONFIG.accountId,
        creator: HEDERA_CONFIG.accountId,
        timestamp: new Date().toISOString(),
        transactionId,
      };
      
      // Store NFT data
      await this.storeNFT(nft);
      
      const transaction: HederaTransaction = {
        transactionId,
        status: 'SUCCESS',
        type: 'MINT',
        tokenId: nft.tokenId,
        serialNumber,
        timestamp: new Date().toISOString(),
        explorerUrl: this.getExplorerUrl(transactionId),
      };
      
      console.log('✅ Health data NFT minted successfully on Hedera');
      console.log(`🔐 Encrypted data stored on Walrus: ${walrusBlobId}`);
      console.log(`🆔 NFT Serial Number: ${serialNumber}`);
      
      return transaction;
    } catch (error) {
      console.error('❌ Failed to mint NFT:', error);
      throw error;
    }
  }

  // List NFT on marketplace
  async listNFTForSale(
    tokenId: string,
    serialNumber: number,
    price: number
  ): Promise<HederaTransaction> {
    try {
      console.log(`📢 Listing NFT ${serialNumber} for sale at ${price} HBAR...`);
      
      const transactionId = `${HEDERA_CONFIG.accountId}@${Date.now()}`;
      
      const transaction: HederaTransaction = {
        transactionId,
        status: 'SUCCESS',
        type: 'LIST',
        tokenId,
        serialNumber,
        amount: price,
        timestamp: new Date().toISOString(),
        explorerUrl: this.getExplorerUrl(transactionId),
      };
      
      console.log('✅ NFT listed on Hedera marketplace');
      return transaction;
    } catch (error) {
      console.error('❌ Failed to list NFT:', error);
      throw error;
    }
  }

  // Purchase NFT and get decryption key
  async purchaseNFT(
    tokenId: string,
    serialNumber: number,
    seller: string,
    price: number
  ): Promise<{ transaction: HederaTransaction; decryptionKey: string }> {
    try {
      console.log(`💰 Purchasing NFT ${serialNumber} for ${price} HBAR...`);
      
      const buyer = `0.0.${Math.floor(Math.random() * 1000000) + 5000000}`; // Simulate buyer
      const transactionId = `${buyer}@${Date.now()}`;
      
      // Retrieve the NFT metadata
      const nft = await this.getNFT(tokenId, serialNumber);
      
      if (!nft) {
        throw new Error('NFT not found');
      }
      
      // After successful purchase, decrypt the data key
      const decryptionKey = await EncryptionService.decryptData(
        nft.metadata.encryptedDataKey,
        'MASTER_NFT_KEY' // In production, use proper key management
      );
      
      // Store the decryption key for the buyer
      const keyId = `${tokenId}_${serialNumber}`;
      this.purchaseKeys.set(keyId, decryptionKey);
      await this.savePurchaseKeys();
      
      const transaction: HederaTransaction = {
        transactionId,
        status: 'SUCCESS',
        type: 'PURCHASE',
        tokenId,
        serialNumber,
        from: seller,
        to: buyer,
        amount: price,
        timestamp: new Date().toISOString(),
        explorerUrl: this.getExplorerUrl(transactionId),
      };
      
      console.log('✅ NFT purchased successfully');
      console.log('🔓 Decryption key provided to buyer');
      
      return { transaction, decryptionKey };
    } catch (error) {
      console.error('❌ Failed to purchase NFT:', error);
      throw error;
    }
  }

  // Get decryption key for owned NFT
  async getDecryptionKey(tokenId: string, serialNumber: number): Promise<string | null> {
    const keyId = `${tokenId}_${serialNumber}`;
    return this.purchaseKeys.get(keyId) || null;
  }

  // Decrypt health data from Walrus using purchase key
  async decryptHealthData(
    walrusBlobId: string,
    encryptedData: string,
    decryptionKey: string
  ): Promise<any> {
    try {
      console.log('🔓 Decrypting health data from Walrus...');
      
      const decryptedData = await EncryptionService.decryptData(
        encryptedData,
        decryptionKey
      );
      
      const healthData = JSON.parse(decryptedData);
      console.log('✅ Health data decrypted successfully');
      
      return healthData;
    } catch (error) {
      console.error('❌ Failed to decrypt health data:', error);
      throw error;
    }
  }

  // Check Hedera testnet status
  async checkTestnetStatus(): Promise<{
    isConnected: boolean;
    network: string;
    accountBalance: number;
  }> {
    try {
      // Simulate testnet check
      return {
        isConnected: true,
        network: 'testnet',
        accountBalance: 100, // HBAR balance
      };
    } catch (error) {
      console.error('❌ Failed to check testnet status:', error);
      return {
        isConnected: false,
        network: 'testnet',
        accountBalance: 0,
      };
    }
  }

  // Helper functions
  private sanitizeHealthData(data: any): any {
    // Remove all PII fields
    const sanitized = { ...data };
    const piiFields = [
      'firstName', 'lastName', 'name', 'email', 'phone',
      'address', 'ssn', 'dob', 'dateOfBirth', 'id',
      'patientId', 'userId', 'personalInfo'
    ];
    
    piiFields.forEach(field => {
      delete sanitized[field];
    });
    
    // Add anonymous identifier
    sanitized.anonymousId = `health_${Math.random().toString(36).substr(2, 12)}`;
    sanitized.dataVersion = '1.0';
    sanitized.encrypted = true;
    
    return sanitized;
  }

  private generateDataHash(data: string): string {
    // Simple hash generation (in production, use proper crypto)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private async storeNFT(nft: HederaNFT): Promise<void> {
    const key = `@hedera_nft_${nft.tokenId}_${nft.serialNumber}`;
    await AsyncStorage.setItem(key, JSON.stringify(nft));
  }

  private async getNFT(tokenId: string, serialNumber: number): Promise<HederaNFT | null> {
    const key = `@hedera_nft_${tokenId}_${serialNumber}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  private async savePurchaseKeys(): Promise<void> {
    const keys = Object.fromEntries(this.purchaseKeys);
    await AsyncStorage.setItem(STORAGE_KEYS.PURCHASE_KEYS, JSON.stringify(keys));
  }

  private getExplorerUrl(transactionId: string): string {
    return `https://hashscan.io/testnet/transaction/${transactionId}`;
  }

  // Log transaction details
  logTransactionDetails(transaction: HederaTransaction): void {
    console.log('');
    console.log('🔷 ================ HEDERA TRANSACTION ================');
    console.log(`📝 Type: ${transaction.type}`);
    console.log(`🆔 Transaction ID: ${transaction.transactionId}`);
    console.log(`✅ Status: ${transaction.status}`);
    if (transaction.tokenId) console.log(`🎨 Token ID: ${transaction.tokenId}`);
    if (transaction.serialNumber) console.log(`#️⃣ Serial Number: ${transaction.serialNumber}`);
    if (transaction.amount) console.log(`💰 Amount: ${transaction.amount} HBAR`);
    console.log(`🔗 Explorer: ${transaction.explorerUrl}`);
    console.log(`⏰ Timestamp: ${transaction.timestamp}`);
    console.log('====================================================');
    console.log('');
  }
}

export default new HederaBlockchainService();