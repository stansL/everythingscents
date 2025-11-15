'use client';

import React, { useState, useEffect, useRef } from 'react';
import { transactionService } from '@/lib/services/transactions/transactionService';
import { Transaction, TransactionStatus } from '@/lib/services/transactions/types';
import { PaymentMethod, Invoice } from '@/lib/services/invoices/types';
import { formatAmountFromCents, formatDate } from '@/lib/utils/formatters';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';

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
  
  // Invoice search state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnmatchedTransactions();
    fetchInvoices();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await InvoiceService.getAllInvoices();
      if (response.success && response.data) {
        // Filter to unpaid or partially paid invoices
        const unpaidInvoices = response.data.filter(
          inv => inv.status === 'unpaid' || inv.status === 'partially_paid'
        );
        setInvoices(unpaidInvoices);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

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
    setShowDropdown(false);
    // Filter invoices by amount proximity
    filterInvoicesByAmount(transaction.amount);
  };

  const filterInvoicesByAmount = (transactionAmount: number) => {
    // Sort invoices by amount proximity and show closest matches first
    const sorted = [...invoices].sort((a, b) => {
      const diffA = Math.abs(a.amount - transactionAmount);
      const diffB = Math.abs(b.amount - transactionAmount);
      return diffA - diffB;
    });
    setFilteredInvoices(sorted.slice(0, 10)); // Show top 10 matches
  };

  const handleInvoiceSearch = (value: string) => {
    setManualInvoiceId(value);
    
    if (!value.trim()) {
      // Show amount-sorted invoices when empty
      if (selectedTransaction) {
        filterInvoicesByAmount(selectedTransaction.amount);
      } else {
        setFilteredInvoices(invoices.slice(0, 10));
      }
      setShowDropdown(true);
      return;
    }

    // Filter by search term
    const searchLower = value.toLowerCase();
    const filtered = invoices.filter(inv => 
      inv.id.toLowerCase().includes(searchLower) ||
      inv.clientName.toLowerCase().includes(searchLower) ||
      inv.clientEmail?.toLowerCase().includes(searchLower)
    );

    // Sort by amount proximity if transaction is selected
    if (selectedTransaction) {
      filtered.sort((a, b) => {
        const diffA = Math.abs(a.amount - selectedTransaction.amount);
        const diffB = Math.abs(b.amount - selectedTransaction.amount);
        return diffA - diffB;
      });
    }

    setFilteredInvoices(filtered.slice(0, 10));
    setShowDropdown(true);
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setManualInvoiceId(invoice.id);
    setShowDropdown(false);
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
        <div className="space-y-3">
          {/* Unmatched Transactions List with Inline Matching */}
          {unmatchedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border rounded-lg border-gray-200 dark:border-gray-700"
            >
              {/* Transaction Header */}
              <div
                className={`p-4 transition-all cursor-pointer rounded-t-lg ${
                  selectedTransaction?.id === transaction.id
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => handleSelectTransaction(transaction)}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left side - Transaction details in single row */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 whitespace-nowrap">
                      M-Pesa
                    </span>
                    {transaction.mpesaReceiptNumber && (
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {transaction.mpesaReceiptNumber}
                      </span>
                    )}
                    <span className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {formatAmountFromCents(transaction.amount)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(transaction.createdAt)}
                    </span>
                    {transaction.customerPhone && (
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {transaction.customerPhone}
                      </span>
                    )}
                  </div>
                  
                  {/* Right side - Action button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkDisputed(transaction);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors whitespace-nowrap"
                  >
                    Mark Disputed
                  </button>
                </div>
              </div>

              {/* Inline Matching Form */}
              {selectedTransaction?.id === transaction.id && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatAmountFromCents(transaction.amount)}
                      </span>
                    </div>

                    <div className="flex-1 relative" ref={dropdownRef}>
                      <input
                        type="text"
                        id={`invoiceId-${transaction.id}`}
                        value={manualInvoiceId}
                        onChange={(e) => handleInvoiceSearch(e.target.value)}
                        onFocus={() => {
                          filterInvoicesByAmount(transaction.amount);
                          setShowDropdown(true);
                        }}
                        placeholder="Search by invoice ID or customer name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
                        autoComplete="off"
                      />
                      
                      {/* Dropdown */}
                      {showDropdown && filteredInvoices.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredInvoices.map((invoice) => {
                            const amountDiff = Math.abs(invoice.amount - transaction.amount);
                            const isExactMatch = amountDiff === 0;
                            const isCloseMatch = amountDiff < transaction.amount * 0.1; // Within 10%

                            return (
                              <button
                                key={invoice.id}
                                onClick={() => handleSelectInvoice(invoice)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        #{invoice.id}
                                      </span>
                                      {isExactMatch && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                          Exact match
                                        </span>
                                      )}
                                      {!isExactMatch && isCloseMatch && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                          Close match
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                      {invoice.clientName}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                      {formatAmountFromCents(invoice.amount)}
                                    </p>
                                    {!isExactMatch && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Δ {formatAmountFromCents(amountDiff)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleManualMatch}
                      disabled={matching || !manualInvoiceId.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                    >
                      {matching ? 'Matching...' : 'Match Transaction'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedTransaction(null);
                        setManualInvoiceId('');
                        setError(null);
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MpesaTransactionMatcher;
