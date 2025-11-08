import { BaseEntity } from "../common/types";

export interface UserProfile extends BaseEntity {
  uid: string; // Firebase Auth UID
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  
  // Profile information
  photoURL?: string;
  bio?: string;
  
  // Address information
  addresses?: Address[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  
  // Account settings
  emailVerified: boolean;
  phoneVerified?: boolean;
  isActive: boolean;
  role: 'customer' | 'admin' | 'employee';
  
  // Preferences
  preferences?: UserPreferences;
  
  // Marketing
  marketingConsent: boolean;
  newsletterSubscribed: boolean;
  
  // Activity tracking
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  signUpSource?: 'email' | 'google' | 'facebook' | 'apple';
  
  // Shopping related
  totalOrders?: number;
  totalSpent?: number;
  favoriteCategories?: string[];
  loyaltyPoints?: number;
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing' | 'both';
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
  emailNotifications: {
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
    accountActivity: boolean;
  };
  smsNotifications: {
    orderUpdates: boolean;
    promotions: boolean;
  };
  scentPreferences: {
    favoriteScents: string[];
    allergens: string[];
    preferredIntensity: 'light' | 'moderate' | 'strong';
    preferredLongevity: 'short' | 'medium' | 'long';
  };
}

// Input types for creating/updating users
export interface CreateUserProfileInput {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  signUpSource?: 'email' | 'google' | 'facebook' | 'apple';
  marketingConsent?: boolean;
  newsletterSubscribed?: boolean;
}

export type UpdateUserProfileInput = Partial<Omit<UserProfile, 'uid' | 'id' | 'createdAt' | 'updatedAt' | 'email'>>;

export interface UserFilter {
  role?: 'customer' | 'admin' | 'employee';
  isActive?: boolean;
  emailVerified?: boolean;
  signUpSource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string; // Search by name, email, phone
}