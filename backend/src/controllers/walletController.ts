import { Request, Response } from 'express';
import { WalletService, WalletError, CreateWalletData, ConnectWalletData } from '../services/walletService';
import { WalletType, CryptocurrencyType } from '../models/Wallet';
import type { IUser } from '../models/User';
import { XrplService } from '../services/xrplService';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user: IUser;
}

// Wallet controller for handling wallet endpoints
export class WalletController {
  // Create a new wallet
  static async createWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletData: CreateWalletData = {
        userId: req.user._id.toString(),
        type: req.body.type as WalletType,
        cryptocurrencyType: req.body.cryptocurrencyType as CryptocurrencyType,
        label: req.body.label,
        address: req.body.address, // For external wallets
        publicKey: req.body.publicKey, // For external wallets
      };
      
      const wallet = await WalletService.createWallet(walletData);
      
      res.status(201).json({
        success: true,
        data: {
          wallet,
        },
      });
    } catch (error) {
      if (error instanceof WalletError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Create wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the wallet',
      });
    }
  }
  
  // Connect an external wallet
  static async connectWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const connectData: ConnectWalletData = {
        userId: req.user._id.toString(),
        address: req.body.address,
        cryptocurrencyType: req.body.cryptocurrencyType as CryptocurrencyType,
        publicKey: req.body.publicKey,
        label: req.body.label,
      };
      
      const wallet = await WalletService.connectWallet(connectData);
      
      res.status(201).json({
        success: true,
        data: {
          wallet,
        },
      });
    } catch (error) {
      if (error instanceof WalletError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Connect wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while connecting the wallet',
      });
    }
  }
  
  // Get user wallets
  static async getUserWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Always use the authenticated user's ID
      const wallets = await WalletService.getUserWallets(req.user._id.toString());
      
      res.status(200).json({
        success: true,
        data: wallets,
      });
    } catch (error) {
      console.error('Get user wallets error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user wallets',
      });
    }
  }
  
  // Get wallet by ID
  static async getWalletById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletId = req.params.id;
      
      if (!walletId) {
        res.status(400).json({
          success: false,
          message: 'Wallet ID is required',
        });
        return;
      }
      
      const wallet = await WalletService.getWalletById(walletId);
      
      // Ensure wallet belongs to the authenticated user
      if (wallet.userId.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view this wallet',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: {
          wallet,
        },
      });
    } catch (error) {
      if (error instanceof WalletError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Get wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the wallet',
      });
    }
  }
  
  // Delete wallet
  static async deleteWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const walletId = req.params.id;
      
      if (!walletId) {
        res.status(400).json({
          success: false,
          message: 'Wallet ID is required',
        });
        return;
      }
      
      // Get the wallet first to check ownership
      const wallet = await WalletService.getWalletById(walletId);
      
      // Ensure wallet belongs to the authenticated user
      if (wallet.userId.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this wallet',
        });
        return;
      }
      
      const deletedWallet = await WalletService.deleteWallet(walletId);
      
      res.status(200).json({
        success: true,
        data: {
          wallet: deletedWallet,
        },
      });
    } catch (error) {
      if (error instanceof WalletError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Delete wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the wallet',
      });
    }
  }
  
  // Get wallet balance from XRPL
  static async getWalletBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const { walletId } = req.params;
      
      // Get wallet
      const wallet = await WalletService.getWalletById(walletId);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found',
        });
      }
      
      // Verify wallet belongs to user
      if (wallet.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Wallet does not belong to user',
        });
      }
      
      // Get balance from XRPL
      if (wallet.cryptocurrencyType === CryptocurrencyType.XRP) {
        const { balance } = await XrplService.getAccountInfo(wallet.address);
        return res.json({
          success: true,
          data: { balance: parseFloat(balance) },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported cryptocurrency type',
        });
      }
    } catch (error) {
      console.error('Get wallet balance error:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get wallet balance',
      });
    }
  }
} 