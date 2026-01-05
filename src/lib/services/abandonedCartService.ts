/**
 * Abandoned Cart Service
 * Tracks checkout abandonment and payment failures for customer recovery
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export enum AbandonmentStage {
  CHECKOUT_STARTED = 'checkout_started',        // User reached checkout page
  PAYMENT_INITIATED = 'payment_initiated',      // User clicked Pay button
  PAYMENT_REDIRECTED = 'payment_redirected',    // Redirected to payment provider
  PAYMENT_FAILED = 'payment_failed',            // Payment failed
  PAYMENT_ABANDONED = 'payment_abandoned',      // User didn't complete payment
  RECOVERED = 'recovered',                      // Successfully completed order
}

export interface AbandonedCartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AbandonedCart {
  id?: string;
  
  // Customer Information
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Cart Details
  items: AbandonedCartItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  
  // Abandonment Tracking
  stage: AbandonmentStage;
  checkoutStartedAt: Timestamp;
  paymentInitiatedAt?: Timestamp;
  paymentRedirectedAt?: Timestamp;
  lastActivityAt: Timestamp;
  
  // Payment Details (if reached payment stage)
  paymentProvider?: string;
  paymentReference?: string;
  paymentAmount?: number;
  
  // Delivery Information
  deliveryMethod: 'pickup' | 'delivery-local' | 'delivery-outoftown';
  deliveryAddress?: string;
  
  // Recovery Information
  recovered: boolean;
  recoveredAt?: Timestamp;
  orderId?: string;
  invoiceId?: string;
  
  // Follow-up Tracking
  remindersSent: number;
  lastReminderSentAt?: Timestamp;
  contactAttempts: number;
  lastContactedAt?: Timestamp;
  notes?: string;
  
  // Metadata
  userAgent?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentIntent {
  id?: string;
  
  // Customer Information
  customerId?: string;
  customerEmail: string;
  customerPhone: string;
  
  // Payment Details
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  
  // Status Tracking
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'abandoned';
  initiatedAt: Timestamp;
  completedAt?: Timestamp;
  failedAt?: Timestamp;
  abandonedAt?: Timestamp;
  
  // Linking
  abandonedCartId?: string;
  orderId?: string;
  
  // Error Information
  errorCode?: string;
  errorMessage?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class AbandonedCartService {
  private cartsCollection = 'abandonedCarts';
  private intentsCollection = 'paymentIntents';

  /**
   * Create abandoned cart record when user starts checkout
   */
  async createAbandonedCart(data: Omit<AbandonedCart, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: AbandonedCart; error?: string }> {
    try {
      const now = Timestamp.now();
      const cartData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.cartsCollection), cartData);
      
      return {
        success: true,
        data: { ...cartData, id: docRef.id },
      };
    } catch (error: any) {
      console.error('Error creating abandoned cart:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update abandoned cart stage as user progresses through checkout
   */
  async updateAbandonedCartStage(
    cartId: string,
    stage: AbandonmentStage,
    additionalData?: Partial<AbandonedCart>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cartRef = doc(db, this.cartsCollection, cartId);
      const updates: any = {
        stage,
        lastActivityAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...additionalData,
      };

      // Set timestamp for specific stages
      if (stage === AbandonmentStage.PAYMENT_INITIATED) {
        updates.paymentInitiatedAt = Timestamp.now();
      } else if (stage === AbandonmentStage.PAYMENT_REDIRECTED) {
        updates.paymentRedirectedAt = Timestamp.now();
      } else if (stage === AbandonmentStage.RECOVERED) {
        updates.recovered = true;
        updates.recoveredAt = Timestamp.now();
      }

      await updateDoc(cartRef, updates);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating abandoned cart:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create payment intent record
   */
  async createPaymentIntent(data: Omit<PaymentIntent, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: PaymentIntent; error?: string }> {
    try {
      const now = Timestamp.now();
      const intentData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.intentsCollection), intentData);
      
      return {
        success: true,
        data: { ...intentData, id: docRef.id },
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update payment intent status
   */
  async updatePaymentIntent(
    reference: string,
    status: PaymentIntent['status'],
    additionalData?: Partial<PaymentIntent>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find payment intent by reference
      const intentsRef = collection(db, this.intentsCollection);
      const q = query(intentsRef, where('reference', '==', reference), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: 'Payment intent not found' };
      }

      const intentDoc = querySnapshot.docs[0];
      const updates: any = {
        status,
        updatedAt: Timestamp.now(),
        ...additionalData,
      };

      // Set completion/failure timestamps
      if (status === 'completed') {
        updates.completedAt = Timestamp.now();
      } else if (status === 'failed') {
        updates.failedAt = Timestamp.now();
      } else if (status === 'abandoned') {
        updates.abandonedAt = Timestamp.now();
      }

      await updateDoc(doc(db, this.intentsCollection, intentDoc.id), updates);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating payment intent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark cart as recovered when order is successfully created
   */
  async markCartRecovered(
    paymentReference: string,
    orderId: string,
    invoiceId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find abandoned cart by payment reference
      const cartsRef = collection(db, this.cartsCollection);
      const q = query(
        cartsRef,
        where('paymentReference', '==', paymentReference),
        where('recovered', '==', false),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0];
        await this.updateAbandonedCartStage(cartDoc.id, AbandonmentStage.RECOVERED, {
          orderId,
          invoiceId,
        });
      }

      // Update payment intent
      await this.updatePaymentIntent(paymentReference, 'completed', {
        orderId,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error marking cart recovered:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get abandoned carts for follow-up (not recovered, older than X hours)
   */
  async getAbandonedCartsForFollowUp(
    hoursAgo: number = 2,
    maxReminders: number = 3
  ): Promise<{ success: boolean; data?: AbandonedCart[]; error?: string }> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);
      const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

      const cartsRef = collection(db, this.cartsCollection);
      const q = query(
        cartsRef,
        where('recovered', '==', false),
        where('lastActivityAt', '<', cutoffTimestamp),
        where('remindersSent', '<', maxReminders),
        orderBy('lastActivityAt', 'asc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const carts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AbandonedCart[];

      return { success: true, data: carts };
    } catch (error: any) {
      console.error('Error getting abandoned carts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Record reminder sent
   */
  async recordReminderSent(cartId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cartRef = doc(db, this.cartsCollection, cartId);
      await updateDoc(cartRef, {
        remindersSent: (await (await getDoc(cartRef)).data()?.remindersSent || 0) + 1,
        lastReminderSentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error recording reminder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Record contact attempt
   */
  async recordContactAttempt(cartId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cartRef = doc(db, this.cartsCollection, cartId);
      const currentData = (await getDoc(cartRef)).data();
      
      await updateDoc(cartRef, {
        contactAttempts: (currentData?.contactAttempts || 0) + 1,
        lastContactedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(notes && { notes }),
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error recording contact attempt:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const abandonedCartService = new AbandonedCartService();
export default abandonedCartService;
