import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Register a new user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

// Get current user (protected route)
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router; 