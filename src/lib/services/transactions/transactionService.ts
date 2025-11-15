import {
  Transaction,
  TransactionStatus,
  TransactionFilters,
  TransactionSummary,
  ReconciliationStatus,
} from './types';
import { PaymentMethod } from '../invoices/types';

// Check if Firebase is enabled
const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true';

/**
 * Transaction Service
 * Handles transaction CRUD operations and reconciliation
 * Supports both Firebase and mock data modes
 */
class TransactionService {
  private transactions: Transaction[] = [];

  constructor() {
    if (!USE_FIREBASE) {
      this.initializeMockData();
    }
  }

  /**
   * Initialize mock transaction data for development
   */
  private initializeMockData(): void {
    // Mock data will be populated here
    this.transactions = [];
  }

  /**
   * Get all transactions with optional filters
   */
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    if (USE_FIREBASE) {
      // TODO: Implement Firebase Firestore query
      return [];
    }

    let filtered = [...this.transactions];

    if (filters) {
      if (filters.startDate) {
        filtered = filtered.filter(
          (t) => new Date(t.processedAt) >= filters.startDate!
        );
      }
      if (filters.endDate) {
        filtered = filtered.filter(
          (t) => new Date(t.processedAt) <= filters.endDate!
        );
      }
      if (filters.paymentMethod) {
        filtered = filtered.filter(
          (t) => t.paymentMethod === filters.paymentMethod
        );
      }
      if (filters.status) {
        filtered = filtered.filter((t) => t.status === filters.status);
      }
      if (filters.reconciliationStatus) {
        filtered = filtered.filter(
          (t) => t.reconciliationStatus === filters.reconciliationStatus
        );
      }
      if (filters.invoiceId) {
        filtered = filtered.filter((t) => t.invoiceId === filters.invoiceId);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.reference?.toLowerCase().includes(term) ||
            t.invoiceId.toLowerCase().includes(term) ||
            t.notes?.toLowerCase().includes(term)
        );
      }
    }

    return filtered;
  }

  /**
   * Get a single transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    if (USE_FIREBASE) {
      // TODO: Implement Firebase Firestore document query
      return null;
    }

    return this.transactions.find((t) => t.id === id) || null;
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (USE_FIREBASE) {
      // TODO: Implement Firebase Firestore document creation
      return newTransaction;
    }

    this.transactions.push(newTransaction);
    return newTransaction;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    id: string,
    status: TransactionStatus
  ): Promise<Transaction | null> {
    if (USE_FIREBASE) {
      // TODO: Implement Firebase Firestore document update
      return null;
    }

    const transaction = this.transactions.find((t) => t.id === id);
    if (!transaction) return null;

    transaction.status = status;
    transaction.updatedAt = new Date();
    return transaction;
  }

  /**
   * Update reconciliation status
   */
  async updateReconciliationStatus(
    id: string,
    reconciliationStatus: ReconciliationStatus
  ): Promise<Transaction | null> {
    if (USE_FIREBASE) {
      // TODO: Implement Firebase Firestore document update
      return null;
    }

    const transaction = this.transactions.find((t) => t.id === id);
    if (!transaction) return null;

    transaction.reconciliationStatus = reconciliationStatus;
    transaction.updatedAt = new Date();
    return transaction;
  }

  /**
   * Get transaction summary for dashboard
   */
  async getTransactionSummary(
    filters?: TransactionFilters
  ): Promise<TransactionSummary> {
    const transactions = await this.getTransactions(filters);

    const summary: TransactionSummary = {
      totalAmount: 0,
      totalCount: transactions.length,
      byPaymentMethod: {
        [PaymentMethod.CASH]: 0,
        [PaymentMethod.MPESA]: 0,
        [PaymentMethod.BANK_TRANSFER]: 0,
      },
      byStatus: {
        [TransactionStatus.PENDING]: 0,
        [TransactionStatus.COMPLETED]: 0,
        [TransactionStatus.FAILED]: 0,
        [TransactionStatus.REFUNDED]: 0,
      },
      pendingReconciliation: 0,
      disputedCount: 0,
    };

    transactions.forEach((transaction) => {
      summary.totalAmount += transaction.amount;
      summary.byPaymentMethod[transaction.paymentMethod] += transaction.amount;
      summary.byStatus[transaction.status] += 1;

      if (transaction.reconciliationStatus === 'pending') {
        summary.pendingReconciliation += 1;
      }
      if (transaction.reconciliationStatus === 'disputed') {
        summary.disputedCount += 1;
      }
    });

    return summary;
  }

  /**
   * Get transactions by invoice ID
   */
  async getTransactionsByInvoiceId(invoiceId: string): Promise<Transaction[]> {
    return this.getTransactions({ invoiceId });
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
