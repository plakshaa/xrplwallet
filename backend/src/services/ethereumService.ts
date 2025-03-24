import Web3 from 'web3';
import { config } from '../config/config';

// Define wallet generation return type
interface GeneratedWallet {
  address: string;
  publicKey: string;
  privateKey: string;
}

// Define transaction return type
interface EthereumTransaction {
  hash: string;
  status: string;
  blockNumber?: number;
}

// Service for Ethereum interactions
export class EthereumService {
  private static web3: Web3 | null = null;
  
  // Initialize Web3 instance
  private static getWeb3(): Web3 {
    if (!EthereumService.web3) {
      EthereumService.web3 = new Web3(config.blockchain.ethereum.rpcUrl);
    }
    return EthereumService.web3;
  }
  
  // Generate a new Ethereum wallet
  static async generateWallet(): Promise<GeneratedWallet> {
    try {
      const web3 = EthereumService.getWeb3();
      const account = web3.eth.accounts.create();
      
      return {
        address: account.address,
        publicKey: '', // Ethereum doesn't expose public key directly
        privateKey: account.privateKey,
      };
    } catch (error) {
      throw new Error(`Failed to generate Ethereum wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get account balance
  static async getBalance(address: string): Promise<string> {
    try {
      const web3 = EthereumService.getWeb3();
      const balanceWei = await web3.eth.getBalance(address);
      const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
      
      return balanceEth;
    } catch (error) {
      throw new Error(`Failed to get Ethereum balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Send ETH from one account to another
  static async sendETH(
    fromAddress: string,
    fromPrivateKey: string,
    toAddress: string,
    amountInETH: string
  ): Promise<EthereumTransaction> {
    try {
      const web3 = EthereumService.getWeb3();
      
      // Convert ETH to Wei
      const amountInWei = web3.utils.toWei(amountInETH, 'ether');
      
      // Get the current gas price and nonce
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(fromAddress);
      
      // Prepare transaction
      const txParams = {
        from: fromAddress,
        to: toAddress,
        value: amountInWei,
        gasPrice,
        nonce,
        gas: '21000', // Standard gas limit for ETH transfers
      };
      
      // Sign the transaction
      const signedTx = await web3.eth.accounts.signTransaction(txParams, fromPrivateKey);
      
      if (!signedTx.rawTransaction) {
        throw new Error('Failed to sign transaction');
      }
      
      // Send the transaction
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      return {
        hash: receipt.transactionHash,
        status: receipt.status ? 'tesSUCCESS' : 'teFAILED',
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      throw new Error(`Failed to send ETH: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get transaction details
  static async getTransaction(transactionHash: string): Promise<any> {
    try {
      const web3 = EthereumService.getWeb3();
      const tx = await web3.eth.getTransaction(transactionHash);
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);
      
      return {
        transaction: tx,
        receipt: receipt,
      };
    } catch (error) {
      throw new Error(`Failed to get Ethereum transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 