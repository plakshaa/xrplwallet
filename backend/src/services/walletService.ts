import { Wallet, IWallet, WalletType, CryptocurrencyType, WalletStatus } from '../models/Wallet';
import { Types } from 'mongoose';
import { XrplService } from './xrplService';
import { EthereumService } from './ethereumService';

// Define wallet error class
export class WalletError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'WalletError';
  }
}

// Interface for wallet creation data
export interface CreateWalletData {
  userId: string;
  type: WalletType;
  cryptocurrencyType: CryptocurrencyType;
  label?: string;
  address?: string; // For external wallets
  publicKey?: string; // For external wallets
}

// Interface for wallet connection data
export interface ConnectWalletData {
  userId: string;
  address: string;
  cryptocurrencyType: CryptocurrencyType;
  publicKey?: string;
  label?: string;
}

// Service for wallet management
export class WalletService {
  // Create a new wallet
  static async createWallet(walletData: CreateWalletData): Promise<IWallet> {
    try {
      const { userId, type, cryptocurrencyType, label } = walletData;
      
      // Check if user already has a wallet of this cryptocurrency type
      const existingWallet = await Wallet.findOne({
        userId: new Types.ObjectId(userId),
        cryptocurrencyType,
        status: WalletStatus.ACTIVE,
      });
      
      if (existingWallet) {
        throw new WalletError(`User already has an active ${cryptocurrencyType} wallet`, 400);
      }
      
      // For internal wallets, generate a new address and keys
      if (type === WalletType.INTERNAL) {
        let wallet: Partial<IWallet> = {
          userId: new Types.ObjectId(userId),
          type,
          cryptocurrencyType,
          label,
          status: WalletStatus.ACTIVE,
          balance: 0,
        };
        
        // Generate wallet address and keys based on cryptocurrency type
        if (cryptocurrencyType === CryptocurrencyType.XRP) {
          const { address, publicKey, privateKey } = await XrplService.generateWallet();
          // Get the initial balance after funding
          const { balance } = await XrplService.getAccountInfo(address);
          wallet = { 
            ...wallet, 
            address, 
            publicKey, 
            privateKey,
            balance: parseFloat(balance)
          };
        } else if (cryptocurrencyType === CryptocurrencyType.ETH) {
          const { address, publicKey, privateKey } = await EthereumService.generateWallet();
          wallet = { ...wallet, address, publicKey, privateKey };
        } else {
          throw new WalletError(`Unsupported cryptocurrency type: ${cryptocurrencyType}`, 400);
        }
        
        // Create and return the wallet
        return await Wallet.create(wallet);
      }
      // For external wallets, use the provided address and public key
      else if (type === WalletType.EXTERNAL) {
        if (!walletData.address) {
          throw new WalletError('Address is required for external wallets', 400);
        }
        
        // Check if this address is already registered
        const existingAddress = await Wallet.findOne({
          address: walletData.address,
          status: WalletStatus.ACTIVE,
        });
        
        if (existingAddress) {
          throw new WalletError('This wallet address is already registered', 400);
        }
        
        // Create and return the wallet
        return await Wallet.create({
          userId: new Types.ObjectId(userId),
          address: walletData.address,
          publicKey: walletData.publicKey,
          type,
          cryptocurrencyType,
          label,
          status: WalletStatus.ACTIVE,
          balance: 0,
        });
      }
      
      throw new WalletError(`Invalid wallet type: ${type}`, 400);
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new Error(`Wallet creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Connect an external wallet
  static async connectWallet(connectData: ConnectWalletData): Promise<IWallet> {
    try {
      const { userId, address, cryptocurrencyType, publicKey, label } = connectData;
      
      // Check if this address is already registered
      const existingAddress = await Wallet.findOne({
        address,
        status: WalletStatus.ACTIVE,
      });
      
      if (existingAddress) {
        throw new WalletError('This wallet address is already registered', 400);
      }
      
      // Create and return the external wallet
      return await Wallet.create({
        userId: new Types.ObjectId(userId),
        address,
        publicKey,
        type: WalletType.EXTERNAL,
        cryptocurrencyType,
        label,
        status: WalletStatus.ACTIVE,
        balance: 0,
      });
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new Error(`Wallet connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get wallet by ID
  static async getWalletById(walletId: string): Promise<IWallet> {
    try {
      const wallet = await Wallet.findById(walletId).select('+privateKey');
      
      if (!wallet) {
        throw new WalletError('Wallet not found', 404);
      }
      
      return wallet;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new Error(`Get wallet failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Get user wallets
  static async getUserWallets(userId: string): Promise<IWallet[]> {
    try {
      return await Wallet.find({
        userId: new Types.ObjectId(userId),
        status: WalletStatus.ACTIVE,
      }).select('+privateKey'); // Include privateKey field
    } catch (error) {
      throw new Error(`Get user wallets failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Update wallet balance
  static async updateWalletBalance(walletId: string, newBalance: number): Promise<IWallet> {
    try {
      const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        { balance: newBalance },
        { new: true }
      );
      
      if (!wallet) {
        throw new WalletError('Wallet not found', 404);
      }
      
      return wallet;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new Error(`Update wallet balance failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Delete wallet (set status to INACTIVE)
  static async deleteWallet(walletId: string): Promise<IWallet> {
    try {
      const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        { status: WalletStatus.INACTIVE },
        { new: true }
      );
      
      if (!wallet) {
        throw new WalletError('Wallet not found', 404);
      }
      
      return wallet;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new Error(`Delete wallet failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 