import mongoose, { Document, Schema } from 'mongoose';

// Define cryptocurrency types
export enum CryptocurrencyType {
  XRP = 'xrp',
  ETH = 'eth',
  BTC = 'btc',
  USDT = 'usdt',
  USDC = 'usdc',
}

// Define wallet types
export enum WalletType {
  INTERNAL = 'internal', // Managed by our platform
  EXTERNAL = 'external', // Connected external wallet (e.g., MetaMask, XUMM)
}

// Define wallet status
export enum WalletStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// Define wallet interface
export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  address: string;
  privateKey?: string; // Only stored for internal wallets (encrypted)
  publicKey?: string;
  type: WalletType;
  cryptocurrencyType: CryptocurrencyType;
  balance: number; // Cached balance (updated periodically)
  status: WalletStatus;
  label?: string; // User-defined label for the wallet
  createdAt: Date;
  updatedAt: Date;
}

// Create wallet schema
const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    address: {
      type: String,
      required: [true, 'Wallet address is required'],
      trim: true,
      unique: true,
    },
    privateKey: {
      type: String,
      select: false, // Don't include private key in query results by default
    },
    publicKey: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(WalletType),
      required: [true, 'Wallet type is required'],
    },
    cryptocurrencyType: {
      type: String,
      enum: Object.values(CryptocurrencyType),
      required: [true, 'Cryptocurrency type is required'],
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE,
      required: [true, 'Wallet status is required'],
    },
    label: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.privateKey;
        return ret;
      },
    },
  }
);

// Create and export Wallet model
export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema); 