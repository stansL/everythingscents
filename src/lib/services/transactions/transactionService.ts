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
   * Generate random mock transaction data for development
   * Creates varied scenarios on each refresh to test different edge cases
   */
  private initializeMockData(): void {
    const now = new Date();
    const transactionCount = Math.floor(Math.random() * 30) + 15; // 15-45 transactions
    this.transactions = [];

    // Generate random invoice IDs
    const invoiceIds = Array.from(
      { length: 50 },
      (_, i) => `${323500 + i}`
    );

    // Payment method distribution (weighted random)
    const paymentMethods = [
      PaymentMethod.MPESA,
      PaymentMethod.MPESA,
      PaymentMethod.MPESA, // 60% M-Pesa
      PaymentMethod.CASH,
      PaymentMethod.CASH, // 40% Cash
      PaymentMethod.BANK_TRANSFER, // 20% Bank Transfer
    ];

    // Status distribution
    const statuses = [
      TransactionStatus.COMPLETED,
      TransactionStatus.COMPLETED,
      TransactionStatus.COMPLETED,
      TransactionStatus.COMPLETED, // 80% completed
      TransactionStatus.PENDING, // 10% pending
      TransactionStatus.FAILED, // 5% failed
      TransactionStatus.REFUNDED, // 5% refunded
    ];

    // Reconciliation status distribution
    const reconciliationStatuses: ReconciliationStatus[] = [
      'matched',
      'matched',
      'matched', // 75% matched
      'pending', // 20% pending
      'disputed', // 5% disputed
    ];

    for (let i = 0; i < transactionCount; i++) {
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const reconciliationStatus = status === TransactionStatus.COMPLETED
        ? reconciliationStatuses[Math.floor(Math.random() * reconciliationStatuses.length)]
        : 'pending';

      // Random amount between KES 500 and KES 50,000
      const amount = Math.floor(Math.random() * 4950000) + 50000;

      // Random time in the past (0-7 days)
      const hoursAgo = Math.floor(Math.random() * 168);
      const processedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      // Generate reference for M-Pesa and Bank Transfer
      let reference: string | undefined;
      if (paymentMethod === PaymentMethod.MPESA) {
        reference = `SH${Math.floor(Math.random() * 90) + 10}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}`;
      } else if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
        const date = new Date(processedAt);
        reference = `BNK${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      }

      // Generate notes based on status and reconciliation
      let notes: string | undefined;
      if (status === TransactionStatus.FAILED) {
        const failReasons = [
          'Insufficient funds',
          'Transaction timeout',
          'Invalid account',
          'Network error',
        ];
        notes = `${paymentMethod === PaymentMethod.MPESA ? 'M-Pesa' : 'Payment'} transaction failed - ${failReasons[Math.floor(Math.random() * failReasons.length)]}`;
      } else if (status === TransactionStatus.REFUNDED) {
        const refundReasons = [
          'Customer requested refund',
          'Order cancelled',
          'Duplicate payment',
          'Item out of stock',
        ];
        notes = `Refund processed - ${refundReasons[Math.floor(Math.random() * refundReasons.length)]}`;
      } else if (reconciliationStatus === 'disputed') {
        const disputeReasons = [
          'Amount mismatch detected',
          'Customer disputes charge',
          'Payment not received by customer',
          'Duplicate transaction suspected',
        ];
        notes = disputeReasons[Math.floor(Math.random() * disputeReasons.length)];
      } else if (reconciliationStatus === 'pending') {
        notes = Math.random() > 0.5 ? 'Awaiting reconciliation' : undefined;
      } else if (paymentMethod === PaymentMethod.CASH) {
        notes = Math.random() > 0.7 ? 'Cash payment received at counter' : undefined;
      }

      this.transactions.push({
        id: `TXN${String(i + 1).padStart(4, '0')}`,
        invoiceId: invoiceIds[Math.floor(Math.random() * invoiceIds.length)],
        amount,
        paymentMethod,
        reference,
        status,
        reconciliationStatus,
        processedAt,
        notes,
        createdAt: processedAt,
        updatedAt: new Date(processedAt.getTime() + Math.random() * 60 * 60 * 1000),
      });
    }

    // Sort by processedAt descending (newest first)
    this.transactions.sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
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

  /**
   * Match a transaction to an invoice
   */
  async matchTransaction(
    transactionId: string,
    invoiceId: string
  ): Promise<Transaction | null> {
    if (USE_FIREBASE) {
      // TODO: Implement Firebase Firestore document update
      return null;
    }

    const transaction = this.transactions.find((t) => t.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update transaction with invoice ID and mark as matched
    transaction.invoiceId = invoiceId;
    transaction.reconciliationStatus = 'matched';
    transaction.updatedAt = new Date();

    return transaction;
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
