// Hedera Smart Contract Service
// Handles smart contract deployment and interaction

import { HEDERA_TESTNET_CREDENTIALS } from '../config/hedera.config';
import { getHederaSDK, isSDKAvailable } from './hederaSDK';

export interface ContractDeploymentResult {
  contractId: string;
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  explorerUrl: string;
  gasUsed?: number;
  contractAddress?: string;
}

export interface ContractCallResult {
  result: any;
  transactionId?: string;
  gasUsed?: number;
  status: 'SUCCESS' | 'FAILED';
}

class HederaSmartContractService {
  private client: any = null;
  private accountId: any = null;
  private privateKey: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      console.log('🔷 Initializing Hedera Smart Contract Service...');
      
      // Check if SDK is available
      const sdkAvailable = await isSDKAvailable();
      if (!sdkAvailable) {
        throw new Error('Hedera SDK not available in this environment');
      }

      const SDK = await getHederaSDK();
      
      // Create client for testnet
      if (HEDERA_TESTNET_CREDENTIALS.NETWORK === 'testnet') {
        this.client = SDK.Client.forTestnet();
      } else {
        this.client = SDK.Client.forMainnet();
      }

      // Set account credentials
      this.accountId = SDK.AccountId.fromString(HEDERA_TESTNET_CREDENTIALS.ACCOUNT_ID);
      this.privateKey = SDK.PrivateKey.fromStringECDSA(HEDERA_TESTNET_CREDENTIALS.PRIVATE_KEY);
      
      // Set operator
      this.client.setOperator(this.accountId, this.privateKey);
      
      // Set max transaction fee
      this.client.setDefaultMaxTransactionFee(SDK.Hbar.fromTinybars(100_000_000)); // 1 HBAR

      this.initialized = true;
      console.log('✅ Hedera Smart Contract Service initialized');
      console.log(`🆔 Account: ${HEDERA_TESTNET_CREDENTIALS.ACCOUNT_ID}`);
      console.log(`🌐 Network: ${HEDERA_TESTNET_CREDENTIALS.NETWORK}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Hedera Smart Contract Service:', error);
      throw error;
    }
  }

  // Deploy a smart contract from bytecode
  async deployContract(
    contractBytecode: string,
    constructorParameters?: any[],
    contractMemo?: string
  ): Promise<ContractDeploymentResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log('🚀 Deploying smart contract to Hedera...');
      console.log(`📝 Memo: ${contractMemo || 'No memo'}`);
      console.log(`🔢 Constructor params: ${constructorParameters?.length || 0}`);

      const SDK = await getHederaSDK();

      // First, create a file to store the contract bytecode
      const fileCreateTx = new SDK.FileCreateTransaction()
        .setKeys([this.privateKey])
        .setContents(contractBytecode);

      if (contractMemo) {
        fileCreateTx.setFileMemo(contractMemo);
      }

      // Submit the file creation transaction
      const fileCreateSubmit = await fileCreateTx.execute(this.client);
      const fileCreateReceipt = await fileCreateSubmit.getReceipt(this.client);
      const bytecodeFileId = fileCreateReceipt.fileId;

      console.log(`📁 Bytecode file created: ${bytecodeFileId}`);

      // Create the contract
      const contractCreateFlow = new SDK.ContractCreateFlow()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(100_000); // Adjust gas as needed

      if (constructorParameters && constructorParameters.length > 0) {
        // Add constructor parameters if provided
        // Note: You'll need to encode these properly based on your contract
        contractCreateFlow.setConstructorParameters(constructorParameters);
      }

      if (contractMemo) {
        contractCreateFlow.setContractMemo(contractMemo);
      }

      // Execute the contract creation
      const contractCreateSubmit = await contractCreateFlow.execute(this.client);
      const contractCreateReceipt = await contractCreateSubmit.getReceipt(this.client);
      const contractId = contractCreateReceipt.contractId;

      console.log('✅ Smart contract deployed successfully!');
      console.log(`📄 Contract ID: ${contractId}`);
      console.log(`🆔 Transaction ID: ${contractCreateSubmit.transactionId}`);

      const result: ContractDeploymentResult = {
        contractId: contractId.toString(),
        transactionId: contractCreateSubmit.transactionId.toString(),
        status: 'SUCCESS',
        explorerUrl: `https://hashscan.io/${HEDERA_TESTNET_CREDENTIALS.NETWORK}/contract/${contractId}`,
        contractAddress: `0x${contractId.toSolidityAddress()}`,
      };

      this.logDeploymentDetails(result);
      return result;

    } catch (error) {
      console.error('❌ Smart contract deployment failed:', error);
      return {
        contractId: '',
        transactionId: '',
        status: 'FAILED',
        explorerUrl: '',
      };
    }
  }

  // Execute a contract function
  async executeContract(
    contractId: string,
    functionName: string,
    parameters?: any[],
    gasLimit: number = 100_000
  ): Promise<ContractCallResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`🔧 Executing contract function: ${functionName}`);
      console.log(`📄 Contract ID: ${contractId}`);
      console.log(`⛽ Gas limit: ${gasLimit}`);

      const SDK = await getHederaSDK();

      const contractExecuteTx = new SDK.ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gasLimit)
        .setFunction(functionName, parameters || []);

      // Execute the transaction
      const contractExecuteSubmit = await contractExecuteTx.execute(this.client);
      const contractExecuteReceipt = await contractExecuteSubmit.getReceipt(this.client);

      console.log('✅ Contract function executed successfully!');
      console.log(`🆔 Transaction ID: ${contractExecuteSubmit.transactionId}`);
      console.log(`📊 Status: ${contractExecuteReceipt.status}`);

      return {
        result: contractExecuteReceipt,
        transactionId: contractExecuteSubmit.transactionId.toString(),
        status: 'SUCCESS',
      };

    } catch (error) {
      console.error('❌ Contract execution failed:', error);
      return {
        result: null,
        status: 'FAILED',
      };
    }
  }

  // Query a contract function (read-only)
  async queryContract(
    contractId: string,
    functionName: string,
    parameters?: any[],
    gasLimit: number = 100_000
  ): Promise<ContractCallResult> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`🔍 Querying contract function: ${functionName}`);
      console.log(`📄 Contract ID: ${contractId}`);

      const SDK = await getHederaSDK();

      const contractCallQuery = new SDK.ContractCallQuery()
        .setContractId(contractId)
        .setGas(gasLimit)
        .setFunction(functionName, parameters || []);

      // Execute the query
      const contractCallResult = await contractCallQuery.execute(this.client);

      console.log('✅ Contract query executed successfully!');

      return {
        result: contractCallResult,
        status: 'SUCCESS',
      };

    } catch (error) {
      console.error('❌ Contract query failed:', error);
      return {
        result: null,
        status: 'FAILED',
      };
    }
  }

  // Get contract info
  async getContractInfo(contractId: string): Promise<any> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const SDK = await getHederaSDK();
      
      // Note: You might need to use ContractInfoQuery here
      // This is a placeholder for contract info retrieval
      console.log(`📋 Getting contract info for: ${contractId}`);
      
      return {
        contractId,
        solidityAddress: `0x${SDK.AccountId.fromString(contractId).toSolidityAddress()}`,
        explorerUrl: `https://hashscan.io/${HEDERA_TESTNET_CREDENTIALS.NETWORK}/contract/${contractId}`,
      };

    } catch (error) {
      console.error('❌ Failed to get contract info:', error);
      return null;
    }
  }

  // Helper method to log deployment details
  private logDeploymentDetails(result: ContractDeploymentResult): void {
    console.log('');
    console.log('🔷 ================ CONTRACT DEPLOYMENT ================');
    console.log(`📄 Contract ID: ${result.contractId}`);
    console.log(`🆔 Transaction ID: ${result.transactionId}`);
    console.log(`✅ Status: ${result.status}`);
    console.log(`🔗 Explorer: ${result.explorerUrl}`);
    if (result.contractAddress) {
      console.log(`📍 Contract Address: ${result.contractAddress}`);
    }
    if (result.gasUsed) {
      console.log(`⛽ Gas Used: ${result.gasUsed}`);
    }
    console.log('====================================================');
    console.log('');
  }
}

export default new HederaSmartContractService();