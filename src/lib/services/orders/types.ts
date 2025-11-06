import { BaseEntity } from "../common/types";

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export type BillingAddress = ShippingAddress;

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'stripe'
  | 'bank_transfer'
  | 'cash_on_delivery';

export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  
  // Order items
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Status
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Payment
  paymentMethod: PaymentMethod;
  paymentTransactionId?: string;
  
  // Addresses
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  
  // Shipping
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Discounts & Promotions
  promoCode?: string;
  promoDiscount?: number;
  
  // Notes
  customerNotes?: string;
  adminNotes?: string;
  
  // Dates
  orderDate: Date;
  confirmedDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  cancelledDate?: Date;
}

export interface OrderFilter {
  customerId?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string; // Search by order number, customer name, or email
}

export type OrderCreateInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'>;

export type OrderUpdateInput = Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber' | 'customerId'>>;