import { Transaction, ITransaction, TransactionStatus, TransactionType } from '../models/Transaction';
import { Wallet, IWallet, CryptocurrencyType, WalletType } from '../models/Wallet';
import { WalletService } from './walletService';
import { XrplService } from './xrplService';
import { EthereumService } from './ethereumService';
import { ExchangeService } from './exchangeService';
import { Types } from 'mongoose';

// Define transaction error class
export class TransactionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'TransactionError';
  }
}

// Interface for transaction creation data
export interface CreateTransactionData {
  senderId: string;
  recipientId?: string;
  senderWalletId: string;
  recipientWalletId?: string;
  recipientAddress: string;
  amount: number;
  cryptocurrencyType: CryptocurrencyType;
  fiatAmount?: number;
  fiatCurrency?: string;
  description?: string;
  type: TransactionType;
}

// Service for transaction management
export class TransactionService {
  // Process a payment transaction
  static async processPayment(transactionData: CreateTransactionData): Promise<ITransaction> {
    try {
      // Validate transaction data
      const { senderId, senderWalletId, recipientAddress, amount, cryptocurrencyType, type } = transactionData;
      
      if (amount <= 0) {
        throw new TransactionError('Transaction amount must be greater than 0', 400);
      }
      
      // Get sender wallet
      const senderWallet = await WalletService.getWalletById(senderWalletId);
      
      if (!senderWallet) {
        throw new TransactionError('Sender wallet not found', 404);
      }
      
      if (senderWallet.userId.toString() !== senderId) {
        throw new TransactionError('Wallet does not belong to the sender', 403);
      }
      
      if (senderWallet.cryptocurrencyType !== cryptocurrencyType) {
        throw new TransactionError('Wallet cryptocurrency type does not match transaction cryptocurrency type', 400);
      }
      
      // For internal wallets, check if balance is sufficient
      if (senderWallet.type === WalletType.INTERNAL) {
        // Get the latest balance from the blockchain
        let currentBalance = 0;
        
        if (cryptocurrencyType === CryptocurrencyType.XRP) {
          const { balance } = await XrplService.getAccountInfo(senderWallet.address);
          currentBalance = parseFloat(balance);
        } else if (cryptocurrencyType === CryptocurrencyType.ETH) {
          const balance = await EthereumService.getBalance(senderWallet.address);
          currentBalance = parseFloat(balance);
        } else {
          // For other cryptocurrencies, use the cached balance
          currentBalance = senderWallet.balance;
        }
        
        // Update wallet balance
        await WalletService.updateWalletBalance(senderWalletId, currentBalance);
        
        if (currentBalance < amount) {
          throw new TransactionError('Insufficient funds', 400);
        }
      }
      
      // Create the transaction record with pending status
      const transaction = await Transaction.create({
        senderId: new Types.ObjectId(senderId),
        recipientId: transactionData.recipientId ? new Types.ObjectId(transactionData.recipientId) : undefined,
        senderWalletId: new Types.ObjectId(senderWalletId),
        recipientWalletId: transactionData.recipientWalletId ? new Types.ObjectId(transactionData.recipientWalletId) : undefined,
        senderAddress: senderWallet.address,
        recipientAddress,
        amount,
        cryptocurrencyType,
        fiatAmount: transactionData.fiatAmount,
        fiatCurrency: transactionData.fiatCurrency || 'USD',
        status: TransactionStatus.PENDING,
        type,
        description: transactionData.description,
      });
      
      // For internal wallets, execute the blockchain transaction
      if (senderWallet.type === WalletType.INTERNAL) {
        try {
          let txResult;
          
          if (cryptocurrencyType === CryptocurrencyType.XRP) {
            if (!senderWallet.privateKey) {
              throw new TransactionError('Sender wallet private key not found', 500);
            }
            
            // Execute XRP payment
            txResult = await XrplService.sendXRP(
              senderWallet.address,
              senderWallet.privateKey,
              recipientAddress,
              amount.toString()
            );
            
            // Update transaction status based on blockchain result
            const updatedTransaction = await Transaction.findByIdAndUpdate(
              transaction._id,
              {
                status: txResult.status === 'tesSUCCESS' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED,
                transactionHash: txResult.hash,
                metadata: txResult.result,
              },
              { new: true }
            );
            
            // If transaction was successful, update the wallet balance from XRPL
            if (txResult.status === 'tesSUCCESS') {
              const { balance } = await XrplService.getAccountInfo(senderWallet.address);
              await WalletService.updateWalletBalance(senderWalletId, parseFloat(balance));
            }
            
            return updatedTransaction!;
          } else if (cryptocurrencyType === CryptocurrencyType.ETH) {
            if (!senderWallet.privateKey) {
              throw new TransactionError('Sender wallet private key not found', 500);
            }
            
            // Execute ETH payment
            txResult = await EthereumService.sendETH(
              senderWallet.address,
              senderWallet.privateKey,
              recipientAddress,
              amount.toString()
            );
            
            // Update transaction status based on blockchain result
            const updatedTransaction = await Transaction.findByIdAndUpdate(
              transaction._id,
              {
                status: txResult.status === 'tesSUCCESS' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED,
                transactionHash: txResult.hash,
                metadata: txResult,
              },
              { new: true }
            );
            
            return updatedTransaction!;
          } else {
            throw new TransactionError(`Unsupported cryptocurrency type: ${cryptocurrencyType}`, 400);
          }
        } catch (error) {
          // Update transaction status to failed in case of blockchain error
          const updatedTransaction = await Transaction.findByIdAndUpdate(
            transaction._id,
            {
              status: TransactionStatus.FAILED,
              metadata: { error: error instanceof Error ? error.message : String(error) },
            },
            { new: true }
          );
          
          throw new TransactionError(`Blockchain transaction failed: ${error instanceof Error ? error.message : String(error)}`, 500);
        }
      }
      
      // For external wallets, just return the pending transaction (user will execute it externally)
      return transaction;
    } catch (error) {
      if (error instanceof TransactionError) {
        throw error;
      }
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get transaction by ID
  static async getTransactionById(transactionId: string): Promise<ITransaction> {
    try {
      const transaction = await Transaction.findById(transactionId);
      
      if (!transaction) {
        throw new TransactionError('Transaction not found', 404);
      }
      
      return transaction;
    } catch (error) {
      if (error instanceof TransactionError) {
        throw error;
      }
      throw new Error(`Get transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get user transactions
  static async getUserTransactions(userId: string): Promise<ITransaction[]> {
    try {
      // Find transactions where the user is either the sender or recipient
      return await Transaction.find({
        $or: [
          { senderId: new Types.ObjectId(userId) },
          { recipientId: new Types.ObjectId(userId) },
        ],
      }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Get user transactions failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Update transaction status after external wallet confirmation
  static async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    transactionHash?: string
  ): Promise<ITransaction> {
    try {
      const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        {
          status,
          transactionHash,
          ...(status === TransactionStatus.COMPLETED ? { completedAt: new Date() } : {}),
        },
        { new: true }
      );
      
      if (!transaction) {
        throw new TransactionError('Transaction not found', 404);
      }
      
      return transaction;
    } catch (error) {
      if (error instanceof TransactionError) {
        throw error;
      }
      throw new Error(`Update transaction status failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 