import { PaymentMethod } from '../invoices/types';

/**
 * Transaction Status Enum
 * Represents the lifecycle status of a transaction
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Reconciliation Status
 * Tracks whether a transaction has been matched with bank/M-Pesa records
 */
export type ReconciliationStatus = 'pending' | 'matched' | 'disputed';

/**
 * Transaction Entity
 * Represents a single payment transaction for reconciliation and tracking
 */
export interface Transaction {
  id: string;
  invoiceId: string;
  amount: number; // In cents
  paymentMethod: PaymentMethod;
  reference?: string; // M-Pesa transaction ID, receipt number, bank reference
  status: TransactionStatus;
  processedAt: Date;
  reconciliationStatus: ReconciliationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Transaction Filters
 * Used for filtering transactions in the data table
 */
export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: PaymentMethod;
  status?: TransactionStatus;
  reconciliationStatus?: ReconciliationStatus;
  invoiceId?: string;
  searchTerm?: string;
}

/**
 * Transaction Summary
 * Aggregated statistics for dashboard widgets
 */
export interface TransactionSummary {
  totalAmount: number;
  totalCount: number;
  byPaymentMethod: Record<PaymentMethod, number>;
  byStatus: Record<TransactionStatus, number>;
  pendingReconciliation: number;
  disputedCount: number;
}
