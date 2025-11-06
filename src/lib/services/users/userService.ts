import { FirestoreService, QueryCondition } from "../../firebase/firestore";
import { ServiceResponse, ServiceUtils, PaginationOptions } from "../common/types";
import { UserProfile, CreateUserProfileInput, UpdateUserProfileInput, UserFilter } from "./types";
import { Timestamp } from "firebase/firestore";

const COLLECTION_NAME = "users";

export class UserService {
  // Create a new user profile in Firestore (after Firebase Auth user is created)
  static async createUserProfile(userData: CreateUserProfileInput): Promise<ServiceResponse<string>> {
    try {
      // Use the Firebase Auth UID as the document ID for easy linking
      const userProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        uid: userData.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        
        // Default values
        emailVerified: false,
        isActive: true,
        role: 'customer',
        marketingConsent: userData.marketingConsent || false,
        newsletterSubscribed: userData.newsletterSubscribed || false,
        signUpSource: userData.signUpSource || 'email',
        
        // Initialize counters
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        
        // Timestamps
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      };

      // Only add optional fields if they have valid values (not undefined, null, or empty string)
      if (userData.phoneNumber && userData.phoneNumber.trim() !== '') {
        userProfile.phoneNumber = userData.phoneNumber;
      }
      
      if (userData.dateOfBirth) {
        userProfile.dateOfBirth = userData.dateOfBirth;
      }
      
      if (userData.gender && userData.gender.trim() !== '') {
        userProfile.gender = userData.gender;
      }

      // Create document with custom ID (Firebase Auth UID)
      await FirestoreService.createWithId(COLLECTION_NAME, userData.uid, userProfile);

      return ServiceUtils.createSuccessResponse(userData.uid, "User profile created successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "create user profile");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get user profile by Firebase Auth UID
  static async getUserProfileByUID(uid: string): Promise<ServiceResponse<UserProfile | null>> {
    try {
      const userProfile = await FirestoreService.getById(COLLECTION_NAME, uid) as UserProfile | null;
      return ServiceUtils.createSuccessResponse(userProfile);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get user profile");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Update user profile
  static async updateUserProfile(uid: string, updateData: UpdateUserProfileInput): Promise<ServiceResponse<boolean>> {
    try {
      // If updating name fields, update displayName too
      if (updateData.firstName || updateData.lastName) {
        const currentProfile = await this.getUserProfileByUID(uid);
        if (currentProfile.success && currentProfile.data) {
          const firstName = updateData.firstName || currentProfile.data.firstName;
          const lastName = updateData.lastName || currentProfile.data.lastName;
          updateData.displayName = `${firstName} ${lastName}`;
        }
      }

      const sanitizedData = ServiceUtils.sanitizeData(updateData);
      const success = await FirestoreService.update(COLLECTION_NAME, uid, sanitizedData);
      
      return ServiceUtils.createSuccessResponse(success, "User profile updated successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "update user profile");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get user profile by email
  static async getUserProfileByEmail(email: string): Promise<ServiceResponse<UserProfile | null>> {
    try {
      const conditions: QueryCondition[] = [
        { field: "email", operator: "==", value: email }
      ];

      const users = await FirestoreService.query(COLLECTION_NAME, conditions) as UserProfile[];
      const user = users.length > 0 ? users[0] : null;
      
      return ServiceUtils.createSuccessResponse(user);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get user by email");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Update last login timestamp
  static async updateLastLogin(uid: string): Promise<ServiceResponse<boolean>> {
    try {
      const updateData = {
        lastLoginAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
      };

      const success = await FirestoreService.update(COLLECTION_NAME, uid, updateData);
      return ServiceUtils.createSuccessResponse(success);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "update last login");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Update user activity
  static async updateLastActive(uid: string): Promise<ServiceResponse<boolean>> {
    try {
      const updateData = {
        lastActiveAt: Timestamp.now(),
      };

      const success = await FirestoreService.update(COLLECTION_NAME, uid, updateData);
      return ServiceUtils.createSuccessResponse(success);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "update last active");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Add address to user profile
  static async addAddress(uid: string, address: Omit<import("./types").Address, 'id'>): Promise<ServiceResponse<boolean>> {
    try {
      const userProfile = await this.getUserProfileByUID(uid);
      if (!userProfile.success || !userProfile.data) {
        return ServiceUtils.createErrorResponse("User profile not found");
      }

      const newAddress = {
        ...address,
        id: `addr_${Date.now()}`, // Generate simple ID
      };

      const currentAddresses = userProfile.data.addresses || [];
      const updatedAddresses = [...currentAddresses, newAddress];

      const success = await FirestoreService.update(COLLECTION_NAME, uid, { addresses: updatedAddresses });
      return ServiceUtils.createSuccessResponse(success, "Address added successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "add address");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get all users with filtering
  static async getUsers(
    filter?: UserFilter,
    pagination?: PaginationOptions
  ): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const conditions = this.buildQueryConditions(filter);
      
      const users = await FirestoreService.query(
        COLLECTION_NAME,
        conditions,
        pagination?.orderBy || 'createdAt',
        pagination?.orderDirection || 'desc',
        pagination?.limit
      ) as UserProfile[];

      return ServiceUtils.createSuccessResponse(users);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get users");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Update user role (admin function)
  static async updateUserRole(uid: string, role: 'customer' | 'admin' | 'employee'): Promise<ServiceResponse<boolean>> {
    try {
      const success = await FirestoreService.update(COLLECTION_NAME, uid, { role });
      return ServiceUtils.createSuccessResponse(success, "User role updated successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "update user role");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Deactivate user account
  static async deactivateUser(uid: string): Promise<ServiceResponse<boolean>> {
    try {
      const success = await FirestoreService.update(COLLECTION_NAME, uid, { isActive: false });
      return ServiceUtils.createSuccessResponse(success, "User account deactivated successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "deactivate user");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Check if user exists in Firestore
  static async userExists(uid: string): Promise<boolean> {
    try {
      const response = await this.getUserProfileByUID(uid);
      return response.success && response.data !== null;
    } catch {
      return false;
    }
  }

  // Private helper method to build query conditions
  private static buildQueryConditions(filter?: UserFilter): QueryCondition[] {
    if (!filter) return [];

    const conditions: QueryCondition[] = [];

    if (filter.role) {
      conditions.push({ field: "role", operator: "==", value: filter.role });
    }

    if (filter.isActive !== undefined) {
      conditions.push({ field: "isActive", operator: "==", value: filter.isActive });
    }

    if (filter.emailVerified !== undefined) {
      conditions.push({ field: "emailVerified", operator: "==", value: filter.emailVerified });
    }

    if (filter.signUpSource) {
      conditions.push({ field: "signUpSource", operator: "==", value: filter.signUpSource });
    }

    // Note: Date range and text search would need to be handled client-side
    // due to Firestore query limitations

    return conditions;
  }
}