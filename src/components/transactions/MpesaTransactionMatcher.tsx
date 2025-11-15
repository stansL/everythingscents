'use client';

import React, { useState, useEffect } from 'react';
import { transactionService } from '@/lib/services/transactions/transactionService';
import { Transaction, TransactionStatus } from '@/lib/services/transactions/types';
import { PaymentMethod } from '@/lib/services/invoices/types';
import { formatAmountFromCents, formatDate } from '@/lib/utils/formatters';

interface MpesaTransactionMatcherProps {
  onMatchComplete?: (transactionId: string, matchedInvoiceId: string) => void;
}

export const MpesaTransactionMatcher: React.FC<MpesaTransactionMatcherProps> = ({ 
  onMatchComplete 
}) => {
  const [unmatchedTransactions, setUnmatchedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [manualInvoiceId, setManualInvoiceId] = useState('');
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUnmatchedTransactions();
  }, []);

  const fetchUnmatchedTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const transactions = await transactionService.getTransactions({
        paymentMethod: PaymentMethod.MPESA,
        reconciliationStatus: 'pending',
        status: TransactionStatus.COMPLETED,
      });
      setUnmatchedTransactions(transactions);
    } catch (err) {
      console.error('Failed to fetch unmatched M-Pesa transactions:', err);
      setError('Failed to load M-Pesa transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setManualInvoiceId('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleManualMatch = async () => {
    if (!selectedTransaction || !manualInvoiceId.trim()) {
      setError('Please enter an invoice ID');
      return;
    }

    setMatching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await transactionService.updateReconciliationStatus(
        selectedTransaction.id,
        'matched',
        `Manually matched to invoice ${manualInvoiceId}`
      );
      
      setSuccessMessage(
        `Transaction ${selectedTransaction.mpesaReceiptNumber || selectedTransaction.id} matched to invoice ${manualInvoiceId}`
      );
      
      // Remove from unmatched list
      setUnmatchedTransactions(prev => 
        prev.filter(t => t.id !== selectedTransaction.id)
      );
      
      // Reset selection
      setSelectedTransaction(null);
      setManualInvoiceId('');
      
      // Notify parent
      onMatchComplete?.(selectedTransaction.id, manualInvoiceId);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to match transaction:', err);
      setError('Failed to match transaction. Please try again.');
    } finally {
      setMatching(false);
    }
  };

  const handleMarkDisputed = async (transaction: Transaction) => {
    try {
      await transactionService.updateReconciliationStatus(
        transaction.id,
        'disputed',
        'Marked as disputed - requires investigation'
      );
      
      setSuccessMessage(`Transaction ${transaction.mpesaReceiptNumber || transaction.id} marked as disputed`);
      
      // Remove from unmatched list
      setUnmatchedTransactions(prev => prev.filter(t => t.id !== transaction.id));
      
      // Reset if this was the selected transaction
      if (selectedTransaction?.id === transaction.id) {
        setSelectedTransaction(null);
        setManualInvoiceId('');
      }
      
      // Auto-dismiss success message
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to mark transaction as disputed:', err);
      setError('Failed to mark transaction as disputed');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            M-Pesa Transaction Matcher
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Match unreconciled M-Pesa transactions to invoices
          </p>
        </div>
        <button
          onClick={fetchUnmatchedTransactions}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {unmatchedTransactions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-green-500 dark:text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            All Caught Up!
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            No unmatched M-Pesa transactions found
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unmatched Transactions List */}
          <div className="space-y-3">
            {unmatchedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  selectedTransaction?.id === transaction.id
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleSelectTransaction(transaction)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        M-Pesa
                      </span>
                      {transaction.mpesaReceiptNumber && (
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          {transaction.mpesaReceiptNumber}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline space-x-4">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatAmountFromCents(transaction.amount)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(transaction.createdAt)}
                      </span>
                    </div>
                    
                    {transaction.customerPhone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Phone: {transaction.customerPhone}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkDisputed(transaction);
                    }}
                    className="ml-4 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Mark Disputed
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Manual Matching Form */}
          {selectedTransaction && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border-2 border-blue-500 dark:border-blue-400">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Match Transaction
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selected Transaction
                  </label>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatAmountFromCents(selectedTransaction.amount)}
                      </span>
                    </div>
                    {selectedTransaction.mpesaReceiptNumber && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Receipt:</span>
                        <span className="text-sm font-mono text-gray-900 dark:text-white">
                          {selectedTransaction.mpesaReceiptNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice ID to Match
                  </label>
                  <input
                    type="text"
                    id="invoiceId"
                    value={manualInvoiceId}
                    onChange={(e) => setManualInvoiceId(e.target.value)}
                    placeholder="Enter invoice ID (e.g., INV-2024-001)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleManualMatch}
                    disabled={matching || !manualInvoiceId.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {matching ? 'Matching...' : 'Match Transaction'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTransaction(null);
                      setManualInvoiceId('');
                      setError(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MpesaTransactionMatcher;
