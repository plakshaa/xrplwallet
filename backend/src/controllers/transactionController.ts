import { Request, Response } from 'express';
import { TransactionService, TransactionError, CreateTransactionData } from '../services/transactionService';
import { TransactionType, TransactionStatus } from '../models/Transaction';
import { CryptocurrencyType } from '../models/Wallet';
import { ExchangeService } from '../services/exchangeService';

// Transaction controller for handling transaction endpoints
export class TransactionController {
  // Process a payment transaction
  static async processPayment(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }
      
      const { 
        senderWalletId, 
        recipientAddress,
        recipientWalletId,
        recipientId,
        amount, 
        cryptocurrencyType,
        fiatAmount,
        fiatCurrency,
        description 
      } = req.body;
      
      if (!senderWalletId || !recipientAddress || !amount || !cryptocurrencyType) {
        res.status(400).json({
          success: false,
          message: 'Sender wallet ID, recipient address, amount, and cryptocurrency type are required',
        });
        return;
      }
      
      // Create transaction data
      const transactionData: CreateTransactionData = {
        senderId: req.user._id.toString(),
        recipientId,
        senderWalletId,
        recipientWalletId,
        recipientAddress,
        amount: parseFloat(amount),
        cryptocurrencyType: cryptocurrencyType as CryptocurrencyType,
        fiatAmount: fiatAmount ? parseFloat(fiatAmount) : undefined,
        fiatCurrency,
        description,
        type: TransactionType.PAYMENT,
      };
      
      // Process the payment
      const transaction = await TransactionService.processPayment(transactionData);
      
      res.status(201).json({
        success: true,
        data: {
          transaction,
        },
      });
    } catch (error) {
      if (error instanceof TransactionError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while processing the payment',
      });
    }
  }
  
  // Get transaction by ID
  static async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }
      
      const transactionId = req.params.id;
      
      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID is required',
        });
        return;
      }
      
      const transaction = await TransactionService.getTransactionById(transactionId);
      
      // Ensure transaction belongs to the authenticated user
      if (
        transaction.senderId.toString() !== req.user._id.toString() &&
        (!transaction.recipientId || transaction.recipientId.toString() !== req.user._id.toString())
      ) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view this transaction',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: {
          transaction,
        },
      });
    } catch (error) {
      if (error instanceof TransactionError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the transaction',
      });
    }
  }
  
  // Get user transactions
  static async getUserTransactions(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }
      
      const transactions = await TransactionService.getUserTransactions(req.user._id.toString());
      
      res.status(200).json({
        success: true,
        data: {
          transactions,
        },
      });
    } catch (error) {
      console.error('Get user transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user transactions',
      });
    }
  }
  
  // Update transaction status (for external wallet confirmations)
  static async updateTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }
      
      const { transactionId, status, transactionHash } = req.body;
      
      if (!transactionId || !status) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID and status are required',
        });
        return;
      }
      
      // Get the transaction first to check ownership
      const transaction = await TransactionService.getTransactionById(transactionId);
      
      // Ensure transaction belongs to the authenticated user
      if (transaction.senderId.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to update this transaction',
        });
        return;
      }
      
      // Update the transaction status
      const updatedTransaction = await TransactionService.updateTransactionStatus(
        transactionId,
        status as TransactionStatus,
        transactionHash
      );
      
      res.status(200).json({
        success: true,
        data: {
          transaction: updatedTransaction,
        },
      });
    } catch (error) {
      if (error instanceof TransactionError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Update transaction status error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the transaction status',
      });
    }
  }
  
  // Get exchange rate for crypto to fiat
  static async getExchangeRate(req: Request, res: Response): Promise<void> {
    try {
      const { cryptoType, fiatCurrency } = req.query;
      
      if (!cryptoType) {
        res.status(400).json({
          success: false,
          message: 'Cryptocurrency type is required',
        });
        return;
      }
      
      const exchange = await ExchangeService.getCryptoPrice(
        cryptoType as CryptocurrencyType,
        (fiatCurrency as string) || 'usd'
      );
      
      res.status(200).json({
        success: true,
        data: {
          cryptoType,
          fiatCurrency: (fiatCurrency as string) || 'usd',
          exchangeRate: exchange,
        },
      });
    } catch (error) {
      console.error('Get exchange rate error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the exchange rate',
      });
    }
  }
} 