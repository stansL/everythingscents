// Invoice Management System Types

// Workflow Status Enum for Invoice Lifecycle
export enum WorkflowStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  PICKED_UP = 'picked_up',
  CANCELLED = 'cancelled'
}

// Payment Method Enum
export enum PaymentMethod {
  CASH = 'cash',
  MPESA = 'mpesa',
  BANK_TRANSFER = 'bank_transfer'
}

// Payment Interface for Multiple Payments per Invoice
export interface Payment {
  id: string;
  amount: number; // In cents
  method: PaymentMethod;
  reference?: string; // M-Pesa transaction ID
  processedAt: Date;
  notes?: string;
}

// Delivery Information Interface
export interface DeliveryInfo {
  type: 'pickup' | 'delivery';
  status: 'pending' | 'out_for_delivery' | 'completed';
  scheduledDate?: Date;
  completedDate?: Date;
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
  notes?: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number; // in cents
  amount: number; // quantity * rate in cents
  discount?: number; // in cents
}

export interface Invoice {
  id: string;                    // e.g., "323534" (# added in UI display only)
  clientName: string;           // e.g., "Lindsey Curtis"
  clientEmail?: string;         // For customer search
  issueDate: Date;              // August 7, 2028
  dueDate: Date;                // February 28, 2028
  amount: number;               // 999 (in cents for precision)
  items?: InvoiceItem[];        // Invoice line items
  subtotal?: number;            // Subtotal before tax/discount (in cents)
  taxAmount?: number;           // Tax amount (in cents)
  discountAmount?: number;      // Discount amount (in cents)
  status: 'paid' | 'unpaid' | 'draft';
  category?: string;            // For filtering
  description?: string;         // Invoice description
  notes?: string;              // Additional notes
  clientAddress?: string;       // Client address
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced Workflow Fields
  workflowStatus: WorkflowStatus;
  payments: Payment[];
  deliveryInfo: DeliveryInfo;
  orderSource: 'walk-in' | 'pwa' | 'staff-assisted';
  paymentDueDate?: Date;
  deliveryScheduledDate?: Date;
  deliveryCompletedDate?: Date;
}

export interface InvoiceMetrics {
  dueWithin30Days: number;      // $120.80
  averagePaymentTime: number;   // 0.00 days  
  upcomingPayoutDays: number;   // 24 days
  totalOutstanding: number;     // $3,450.50
}

export interface FilterOptions {
  status?: 'all' | 'paid' | 'unpaid' | 'draft';
  searchTerm?: string;
  dueDate?: { 
    month?: string; 
    year?: string;
    startDate?: Date;
    endDate?: Date;
  };
  category?: string;
  categoryIds?: string[];
  customer?: string;
  customerIds?: string[];
  amountRange?: {
    min?: number;
    max?: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  totalInvoices?: number;
  totalAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface DateOption {
  label: string;
  value: {
    month: string;
    year: string;
  };
}

export interface InvoiceTableColumn {
  key: keyof Invoice | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export interface InvoiceFormData {
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  amount: number;
  items?: InvoiceItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  dueDate: Date;
  category: string;
  description: string;
  notes?: string;
  status: 'paid' | 'unpaid' | 'draft';
}

export interface InvoiceActionOptions {
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
  duplicate?: boolean;
  sendReminder?: boolean;
}

// Export service response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter state for UI components
export interface FilterState {
  activeFilter: 'all' | 'paid' | 'unpaid' | 'draft';
  searchTerm: string;
  advancedFilters: FilterOptions;
  isFilterDropdownOpen: boolean;
}

// Sort options
export type SortDirection = 'asc' | 'desc';
export interface SortOptions {
  field: keyof Invoice;
  direction: SortDirection;
}