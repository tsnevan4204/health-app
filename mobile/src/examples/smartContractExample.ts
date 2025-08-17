// Example of how to use the Hedera Smart Contract Service
// This shows you how to deploy and interact with smart contracts

import HederaSmartContractService from '../services/hederaSmartContract';

// Example smart contract bytecode (replace with your actual contract)
const EXAMPLE_CONTRACT_BYTECODE = `
608060405234801561001057600080fd5b506040516102bc3803806102bc8339818101604052810190610032919061007a565b80600081905550506100a7565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b91505092915050565b610206806100b66000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063209652551461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea264697066735822122084a8f65b4e4b0a1a0a5b4c7e3c9b5e8b7e5b4c3c1a3a1a4a5a6a7a8a9aaabbcc64736f6c63430008110033
`;

// Example: Deploy a simple storage contract
export async function deployStorageContract(): Promise<void> {
  try {
    console.log('🚀 Starting storage contract deployment example...');

    // Initialize the service
    await HederaSmartContractService.initialize();

    // Deploy the contract
    const deploymentResult = await HederaSmartContractService.deployContract(
      EXAMPLE_CONTRACT_BYTECODE,
      [42], // Constructor parameter: initial value = 42
      'Simple Storage Contract v1.0'
    );

    if (deploymentResult.status === 'SUCCESS') {
      console.log('✅ Contract deployed successfully!');
      console.log(`📄 Contract ID: ${deploymentResult.contractId}`);
      console.log(`🔗 View on HashScan: ${deploymentResult.explorerUrl}`);
      
      // Example: Call a function to set a value
      await setStorageValue(deploymentResult.contractId, 100);
      
      // Example: Query the stored value
      await getStorageValue(deploymentResult.contractId);
      
    } else {
      console.error('❌ Contract deployment failed');
    }

  } catch (error) {
    console.error('❌ Deployment example failed:', error);
  }
}

// Example: Set a value in the storage contract
export async function setStorageValue(contractId: string, value: number): Promise<void> {
  try {
    console.log(`📝 Setting storage value to: ${value}`);

    const result = await HederaSmartContractService.executeContract(
      contractId,
      'set', // Function name
      [value], // Parameters
      100_000 // Gas limit
    );

    if (result.status === 'SUCCESS') {
      console.log('✅ Storage value set successfully!');
      console.log(`🆔 Transaction ID: ${result.transactionId}`);
    } else {
      console.error('❌ Failed to set storage value');
    }

  } catch (error) {
    console.error('❌ Set storage value failed:', error);
  }
}

// Example: Get a value from the storage contract
export async function getStorageValue(contractId: string): Promise<number | null> {
  try {
    console.log('🔍 Getting storage value...');

    const result = await HederaSmartContractService.queryContract(
      contractId,
      'get', // Function name
      [], // No parameters for getter
      50_000 // Gas limit
    );

    if (result.status === 'SUCCESS') {
      console.log('✅ Storage value retrieved successfully!');
      console.log(`📊 Value: ${result.result}`);
      return result.result;
    } else {
      console.error('❌ Failed to get storage value');
      return null;
    }

  } catch (error) {
    console.error('❌ Get storage value failed:', error);
    return null;
  }
}

// Example: Deploy a health data storage contract
export async function deployHealthDataContract(): Promise<string | null> {
  try {
    console.log('🏥 Deploying health data storage contract...');

    // You would replace this with your actual health data contract bytecode
    const healthContractBytecode = EXAMPLE_CONTRACT_BYTECODE; // Replace with real contract

    const deploymentResult = await HederaSmartContractService.deployContract(
      healthContractBytecode,
      [], // Constructor parameters for health contract
      'Health Data Storage Contract v1.0'
    );

    if (deploymentResult.status === 'SUCCESS') {
      console.log('✅ Health data contract deployed!');
      console.log(`📄 Contract ID: ${deploymentResult.contractId}`);
      console.log(`💊 Health data can now be stored on-chain`);
      console.log(`🔗 View contract: ${deploymentResult.explorerUrl}`);
      
      return deploymentResult.contractId;
    } else {
      console.error('❌ Health data contract deployment failed');
      return null;
    }

  } catch (error) {
    console.error('❌ Health data contract deployment failed:', error);
    return null;
  }
}

// Usage example in your app:
/*
import { deployStorageContract, deployHealthDataContract } from './examples/smartContractExample';

// Deploy a simple storage contract
await deployStorageContract();

// Deploy a health data contract
const healthContractId = await deployHealthDataContract();
if (healthContractId) {
  // Use the contract for storing health data
  console.log('Health contract ready:', healthContractId);
}
*/