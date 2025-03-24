import mongoose, { Document, Schema } from 'mongoose';
import { CryptocurrencyType } from './Wallet';

// Define transaction status
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Define transaction type
export enum TransactionType {
  PAYMENT = 'payment',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  EXCHANGE = 'exchange',
}

// Define transaction interface
export interface ITransaction extends Document {
  senderId: mongoose.Types.ObjectId; // User ID
  recipientId?: mongoose.Types.ObjectId; // User ID (can be null for some transaction types)
  senderWalletId: mongoose.Types.ObjectId;
  recipientWalletId?: mongoose.Types.ObjectId;
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  cryptocurrencyType: CryptocurrencyType;
  fiatAmount?: number; // Equivalent amount in fiat (e.g., USD)
  fiatCurrency?: string; // e.g., USD, EUR
  exchangeRate?: number; // Exchange rate at the time of transaction
  transactionHash?: string; // Blockchain transaction hash
  status: TransactionStatus;
  type: TransactionType;
  fee?: number; // Transaction fee
  description?: string;
  metadata?: Record<string, any>; // Additional data
  createdAt: Date;
  updatedAt: Date;
}

// Create transaction schema
const transactionSchema = new Schema<ITransaction>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    senderWalletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Sender wallet ID is required'],
    },
    recipientWalletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    senderAddress: {
      type: String,
      required: [true, 'Sender address is required'],
      trim: true,
    },
    recipientAddress: {
      type: String,
      required: [true, 'Recipient address is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be greater than 0'],
    },
    cryptocurrencyType: {
      type: String,
      enum: Object.values(CryptocurrencyType),
      required: [true, 'Cryptocurrency type is required'],
    },
    fiatAmount: {
      type: Number,
    },
    fiatCurrency: {
      type: String,
      default: 'USD',
    },
    exchangeRate: {
      type: Number,
    },
    transactionHash: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      required: [true, 'Transaction status is required'],
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, 'Transaction type is required'],
    },
    fee: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ recipientId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });

// Create and export Transaction model
export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema); 