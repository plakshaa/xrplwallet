import jwt from 'jsonwebtoken';
import { User, IUser, UserType } from '../models/User';
import { config } from '../config/config';

// Define auth error class
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

// Interface for user registration data
export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  companyName?: string;
  businessNumber?: string;
}

// Interface for user login data
export interface LoginUserData {
  email: string;
  password: string;
}

// Interface for JWT payload
export interface JwtPayload {
  id: string;
  email: string;
  userType: UserType;
}

// Service for authentication
export class AuthService {
  // Register a new user
  static async register(userData: RegisterUserData): Promise<{ user: IUser; token: string }> {
    try {
      // Check if user with the email already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        throw new AuthError('User with this email already exists', 400);
      }
      
      // Create new user
      const user = await User.create(userData);
      
      // Generate JWT token
      const token = AuthService.generateToken(user);
      
      return { user, token };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Login user
  static async login(loginData: LoginUserData): Promise<{ user: IUser; token: string }> {
    try {
      // Find user by email and include password for comparison
      const user = await User.findOne({ email: loginData.email }).select('+password');
      
      if (!user) {
        throw new AuthError('Invalid email or password');
      }
      
      // Compare passwords
      const isPasswordValid = await user.comparePassword(loginData.password);
      
      if (!isPasswordValid) {
        throw new AuthError('Invalid email or password');
      }
      
      // Generate JWT token
      const token = AuthService.generateToken(user);
      
      // Remove password from user object
      const userWithoutPassword = user.toObject();
      delete userWithoutPassword.password;
      
      return { user: userWithoutPassword as IUser, token };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new Error(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Verify JWT token
  static async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      throw new AuthError('Invalid or expired token');
    }
  }
  
  // Generate JWT token
  private static generateToken(user: IUser): string {
    const payload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
    };
    
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }
} 