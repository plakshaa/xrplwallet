import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all wallet routes
router.use(authenticate);

// Create a new wallet
router.post('/create', WalletController.createWallet);

// Connect an external wallet
router.post('/connect', WalletController.connectWallet);

// Get user wallets
router.get('/', WalletController.getUserWallets);

// Get wallet by ID
router.get('/:walletId', WalletController.getWalletById);

// Get wallet balance
router.get('/:walletId/balance', WalletController.getWalletBalance);

// Delete wallet
router.delete('/:walletId', WalletController.deleteWallet);

export default router; 