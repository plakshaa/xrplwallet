import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public route for getting exchange rates
router.get('/exchange-rate', TransactionController.getExchangeRate);

// Apply authentication middleware to protected transaction routes
router.use(authenticate);

// Process a payment
router.post('/payment', TransactionController.processPayment);

// Get user transactions
router.get('/', TransactionController.getUserTransactions);

// Get transaction by ID
router.get('/:id', TransactionController.getTransactionById);

// Update transaction status (for external wallet confirmations)
router.put('/status', TransactionController.updateTransactionStatus);

export default router; 