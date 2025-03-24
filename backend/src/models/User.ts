import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';

// Define user type
export enum UserType {
  INDIVIDUAL = 'individual',
  MERCHANT = 'merchant',
}

// Define user interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  companyName?: string;
  businessNumber?: string;
  kycVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create user schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: 'Please provide a valid email',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in query results by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    userType: {
      type: String,
      enum: Object.values(UserType),
      required: [true, 'User type is required'],
      default: UserType.INDIVIDUAL,
    },
    companyName: {
      type: String,
      trim: true,
      // Required only for merchant users
      validate: {
        validator: function(this: any, value: string): boolean {
          return this.userType !== UserType.MERCHANT || Boolean(value && value.length > 0);
        },
        message: 'Company name is required for merchant accounts',
      },
    },
    businessNumber: {
      type: String,
      trim: true,
      // Required only for merchant users
      validate: {
        validator: function(this: any, value: string): boolean {
          return this.userType !== UserType.MERCHANT || Boolean(value && value.length > 0);
        },
        message: 'Business number is required for merchant accounts',
      },
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Create and export User model
export const User = mongoose.model<IUser>('User', userSchema); 