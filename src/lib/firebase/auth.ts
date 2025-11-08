import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./config";
import { UserService } from "../services/users/userService";
import { CreateUserProfileInput } from "../services/users/types";

// Authentication service functions
export class AuthService {
  // Sign up with email and password (creates both Auth user and Firestore profile)
  static async signUpWithProfile(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    marketingConsent?: boolean;
    newsletterSubscribed?: boolean;
  }) {
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      // 2. Update display name in Firebase Auth
      const displayName = `${userData.firstName} ${userData.lastName}`;
      await updateProfile(user, { displayName });

      // 3. Create user profile in Firestore
      const profileData: CreateUserProfileInput = {
        uid: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        marketingConsent: userData.marketingConsent,
        newsletterSubscribed: userData.newsletterSubscribed,
        signUpSource: 'email',
      };

      const profileResponse = await UserService.createUserProfile(profileData);
      
      if (!profileResponse.success) {
        // If profile creation fails, we should handle this appropriately
        // You might want to delete the Auth user or log the error
        console.error("Failed to create user profile:", profileResponse.error);
        throw new Error(profileResponse.error || "Failed to create user profile");
      }

      return {
        user,
        profile: profileResponse.data
      };
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }

  // Legacy sign up method (kept for backward compatibility)
  static async signUp(email: string, password: string, displayName?: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  // Sign in with Google (creates profile if first time)
  static async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists in Firestore
      const existingProfile = await UserService.getUserProfileByUID(user.uid);
      
      if (!existingProfile.success || !existingProfile.data) {
        // First time Google sign-in, create profile
        const names = (user.displayName || user.email || '').split(' ');
        const firstName = names[0] || 'User';
        const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

        const profileData: CreateUserProfileInput = {
          uid: user.uid,
          email: user.email || '',
          firstName,
          lastName,
          signUpSource: 'google',
        };

        await UserService.createUserProfile(profileData);
      }

      return user;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  }

  // Sign out
  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  // Send password reset email
  static async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Update user profile
  static async updateUserProfile(displayName?: string, photoURL?: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    try {
      await updateProfile(user, {
        displayName: displayName || user.displayName,
        photoURL: photoURL || user.photoURL,
      });
      return user;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }
}

export { auth };