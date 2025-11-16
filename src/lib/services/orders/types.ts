/**
 * Order Management Types
 * Defines interfaces and enums for order handling and PWA integration
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Order Status Enum
 * Tracks the lifecycle of an order from creation to completion
 */
export enum OrderStatus {
  PENDING = 'pending',           // Order created, awaiting confirmation
  CONFIRMED = 'confirmed',       // Order confirmed by staff
  PROCESSING = 'processing',     // Order being prepared
  READY = 'ready',              // Order ready for pickup/delivery
  OUT_FOR_DELIVERY = 'out_for_delivery', // Order dispatched for delivery
  DELIVERED = 'delivered',      // Order successfully delivered
  PICKED_UP = 'picked_up',      // Order picked up by customer
  CANCELLED = 'cancelled',      // Order cancelled
  FAILED = 'failed'             // Order failed (payment/delivery issue)
}

/**
 * Order Source Enum
 * Identifies where the order originated from
 */
export enum OrderSource {
  PWA = 'pwa',           // Order from PWA (customer self-service)
  ADMIN = 'admin',       // Order created by staff via admin dashboard
  PHONE = 'phone',       // Order taken over phone
  WALK_IN = 'walk_in'    // Walk-in customer order
}

/**
 * Order Item Interface
 * Represents a single product in an order
 */
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;        // Discount percentage (0-100)
  totalPrice: number;
  notes?: string;
}

/**
 * Order Interface
 * Represents a customer order that can be converted to an invoice
 */
export interface Order {
  id: string;
  orderNumber: string;           // Human-readable order number (e.g., ORD-2024-001)
  
  // Customer Information
  customerId?: string;            // Reference to user if registered
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Order Details
  items: OrderItem[];
  subtotal: number;
  discountPercentage: number;  // Overall order discount percentage (0-100)
  tax: number;
  total: number;
  
  // Order Status
  status: OrderStatus;
  source: OrderSource;
  
  // Delivery Information
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  deliveryNotes?: string;
  estimatedDeliveryDate?: Date | Timestamp;
  
  // Payment Information (optional at order stage)
  isPaid: boolean;
  paymentMethod?: string;
  paymentReference?: string;
  
  // Conversion to Invoice
  invoiceId?: string;             // Set when order is converted to invoice
  convertedAt?: Date | Timestamp; // Timestamp of conversion
  
  // Metadata
  notes?: string;
  createdBy: string;              // User ID of staff who created order
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Order Summary Interface
 * Used for displaying order lists and summaries
 */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  source: OrderSource;
  createdAt: Date | Timestamp;
}

/**
 * Order Filter Interface
 * Used for filtering orders in queries
 */
export interface OrderFilter {
  status?: OrderStatus;
  source?: OrderSource;
  customerId?: string;
  dateFrom?: Date | Timestamp;
  dateTo?: Date | Timestamp;
  searchTerm?: string;
}