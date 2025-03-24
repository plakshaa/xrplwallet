import { Client, Wallet as XrplWallet, dropsToXrp, xrpToDrops } from 'xrpl';
import { config } from '../config/config';

// Define wallet generation return type
interface GeneratedWallet {
  address: string;
  publicKey: string;
  privateKey: string;
}

// Define transaction return type
interface XrplTransaction {
  hash: string;
  status: string;
  result?: any;
}

// Service for XRPL interactions
export class XrplService {
  private static client: Client | null = null;
  
  // Initialize XRPL client
  private static async getClient(): Promise<Client> {
    if (!XrplService.client || !XrplService.client.isConnected()) {
      XrplService.client = new Client(config.blockchain.xrpl.server);
      await XrplService.client.connect();
    }
    return XrplService.client;
  }
  
  // Close client connection
  private static async closeClient(): Promise<void> {
    if (XrplService.client && XrplService.client.isConnected()) {
      await XrplService.client.disconnect();
      XrplService.client = null;
    }
  }
  
  // Generate a new XRPL wallet
  static async generateWallet(): Promise<GeneratedWallet> {
    try {
      const client = await XrplService.getClient();
      const wallet = XrplWallet.generate();
      
      // Fund the wallet from faucet if on testnet/devnet
      if (config.nodeEnv !== 'production') {
        try {
          const fundResult = await client.fundWallet(wallet);
          console.log('Wallet funded:', fundResult);
        } catch (fundError) {
          console.error('Failed to fund wallet from faucet:', fundError);
        }
      }
      
      // Close client connection
      await XrplService.closeClient();
      
      return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.seed!,
      };
    } catch (error) {
      throw new Error(`Failed to generate XRPL wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get account information and balance
  static async getAccountInfo(address: string): Promise<{ balance: string; accountData: any }> {
    try {
      const client = await XrplService.getClient();
      
      const accountInfo = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });
      
      // Close client connection
      await XrplService.closeClient();
      
      const balanceInDrops = accountInfo.result.account_data.Balance;
      const balanceInXRP = dropsToXrp(balanceInDrops);
      
      return {
        balance: balanceInXRP,
        accountData: accountInfo.result.account_data,
      };
    } catch (error) {
      throw new Error(`Failed to get XRPL account info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Send XRP from one account to another
  static async sendXRP(
    fromAddress: string,
    fromPrivateKey: string,
    toAddress: string,
    amountInXRP: string
  ): Promise<XrplTransaction> {
    try {
      const client = await XrplService.getClient();
      
      // Create wallet from seed
      const wallet = XrplWallet.fromSeed(fromPrivateKey);
      
      // Verify wallet address matches fromAddress
      if (wallet.address !== fromAddress) {
        throw new Error('Private key does not match sender address');
      }
      
      // Convert XRP to drops (XRPL uses drops as the base unit)
      const amountInDrops = xrpToDrops(amountInXRP);
      
      // Prepare transaction
      const payment = {
        TransactionType: 'Payment',
        Account: fromAddress,
        Destination: toAddress,
        Amount: amountInDrops,
      };
      
      // Sign and submit transaction
      const prepared = await client.autofill(payment);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      
      // Close client connection
      await XrplService.closeClient();
      
      return {
        hash: result.result.hash,
        status: result.result.meta.TransactionResult,
        result: result.result,
      };
    } catch (error) {
      throw new Error(`Failed to send XRP: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get transaction details
  static async getTransaction(transactionHash: string): Promise<any> {
    try {
      const client = await XrplService.getClient();
      
      const tx = await client.request({
        command: 'tx',
        transaction: transactionHash,
      });
      
      // Close client connection
      await XrplService.closeClient();
      
      return tx.result;
    } catch (error) {
      throw new Error(`Failed to get XRPL transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 