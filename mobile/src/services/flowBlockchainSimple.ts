// Simplified Flow blockchain service for Privy integration demo
// This is a placeholder to avoid TypeScript errors while focusing on Privy integration

export interface FlowNFT {
  id: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  transactionId: string;
  blockHeight: number;
  timestamp: string;
}

export interface FlowTransaction {
  transactionId: string;
  status: 'pending' | 'sealed' | 'failed';
  blockHeight?: number;
  gasUsed?: number;
  events: Array<{
    type: string;
    data: any;
  }>;
  timestamp: string;
  explorerUrl?: string;
  gasless?: boolean;
}

class SimpleFlowBlockchainService {
  async authenticate(): Promise<{ address: string; loggedIn: boolean }> {
    console.log('🔐 Flow authentication - using mock data for demo');
    return {
      address: '0x01cf0e2f2f715450',
      loggedIn: true
    };
  }

  async mintHealthDataNFT(
    name: string,
    description: string,
    dataHash: string,
    metrics: string[],
    rarity: string,
    price: number
  ): Promise<FlowTransaction> {
    console.log('🌊 Mocking Flow NFT minting for Privy demo...');
    console.log('📊 Mock minting health data:', { name, rarity, metrics: metrics.length, price });
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTransaction: FlowTransaction = {
      transactionId: `flow_mock_${Date.now()}`,
      status: 'sealed',
      blockHeight: Math.floor(Math.random() * 1000000),
      gasUsed: 0,
      events: [{
        type: 'HealthDataNFT.Minted',
        data: { id: Math.floor(Math.random() * 10000), name, rarity }
      }],
      timestamp: new Date().toISOString(),
      gasless: true
    };

    console.log('✅ Mock transaction completed:', mockTransaction);
    return mockTransaction;
  }

  generateDataHash(data: any): string {
    return `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 10)}`;
  }

  getTestnetExplorerUrl(transactionId: string): string {
    return `https://testnet.flowscan.org/transaction/${transactionId}`;
  }
  
  logTransactionDetails(transaction: FlowTransaction): void {
    console.log('📊 === Mock Flow Transaction Details ===');
    console.log(`🆔 Transaction ID: ${transaction.transactionId}`);
    console.log(`📈 Status: ${transaction.status}`);
    console.log(`🏗️  Block Height: ${transaction.blockHeight || 'Pending'}`);
    console.log(`⛽ Gas Used: ${transaction.gasUsed || 0} (Mock gasless)`);
    console.log(`⏰ Timestamp: ${transaction.timestamp}`);
    console.log(`🎯 Events: ${transaction.events.length}`);
    console.log(`🔗 Explorer: ${this.getTestnetExplorerUrl(transaction.transactionId)}`);
    console.log('================================');
  }
}

export default new SimpleFlowBlockchainService();