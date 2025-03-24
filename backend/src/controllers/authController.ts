import { Request, Response } from 'express';
import { AuthService, AuthError, RegisterUserData, LoginUserData } from '../services/authService';
import { UserType } from '../models/User';

// Auth controller for handling authentication endpoints
export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterUserData = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userType: req.body.userType as UserType,
        companyName: req.body.companyName,
        businessNumber: req.body.businessNumber,
      };
      
      // Additional validation for merchant accounts
      if (userData.userType === UserType.MERCHANT) {
        if (!userData.companyName) {
          res.status(400).json({ success: false, message: 'Company name is required for merchant accounts' });
          return;
        }
        
        if (!userData.businessNumber) {
          res.status(400).json({ success: false, message: 'Business number is required for merchant accounts' });
          return;
        }
      }
      
      const { user, token } = await AuthService.register(userData);
      
      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during registration',
      });
    }
  }
  
  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginUserData = {
        email: req.body.email,
        password: req.body.password,
      };
      
      const { user, token } = await AuthService.login(loginData);
      
      res.status(200).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during login',
      });
    }
  }
  
  // Get current user
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // User should be added to request by auth middleware
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching user data',
      });
    }
  }
} 