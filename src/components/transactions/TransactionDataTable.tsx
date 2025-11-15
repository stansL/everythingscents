'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@/icons';
import { Transaction, TransactionStatus, TransactionFilters } from '@/lib/services/transactions/types';
import { PaymentMethod } from '@/lib/services/invoices/types';
import { formatAmountFromCents, formatDate } from '@/lib/utils/formatters';
import { transactionService } from '@/lib/services/transactions/transactionService';

export interface SortConfig {
  key: keyof Transaction;
  direction: 'asc' | 'desc';
}

interface TransactionDataTableProps {
  filters?: TransactionFilters;
  onRowAction?: (action: 'view' | 'reconcile', transaction: Transaction) => void;
}

export const TransactionDataTable: React.FC<TransactionDataTableProps> = React.memo(({
  filters,
  onRowAction,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'processedAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const data = await transactionService.getTransactions(filters);
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters]);

  // Sort transactions
  const sortedTransactions = React.useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) return 0;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [transactions, sortConfig]);

  // Paginate transactions
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSortIcon = (key: SortConfig['key']) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUpIcon className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUpIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" /> :
      <ChevronDownIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />;
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig: Record<TransactionStatus, { label: string; color: string }> = {
      [TransactionStatus.PENDING]: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      [TransactionStatus.COMPLETED]: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      [TransactionStatus.FAILED]: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      [TransactionStatus.REFUNDED]: { label: 'Refunded', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getReconciliationBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      matched: { label: 'Matched', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Cash',
      [PaymentMethod.MPESA]: 'M-Pesa',
      [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
    };
    return labels[method];
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="animate-pulse">
          {/* Table Header Skeleton */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
              ))}
            </div>
          </div>
          {/* Table Rows Skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-t border-gray-200 dark:border-gray-600 px-6 py-4">
              <div className="flex space-x-4">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 dark:bg-gray-700 rounded flex-1"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedTransactions.length === 0 && !loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            No transactions found matching your criteria.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* Transaction ID Column */}
              <th className="px-4 py-4 text-left min-w-[120px]">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Transaction ID</span>
                  {getSortIcon('id')}
                </button>
              </th>

              {/* Invoice ID Column */}
              <th className="px-4 py-4 text-left min-w-[100px]">
                <button
                  onClick={() => handleSort('invoiceId')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Invoice</span>
                  {getSortIcon('invoiceId')}
                </button>
              </th>

              {/* Amount Column */}
              <th className="px-4 py-4 text-left min-w-[100px]">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Amount</span>
                  {getSortIcon('amount')}
                </button>
              </th>

              {/* Payment Method Column */}
              <th className="px-4 py-4 text-left min-w-[120px]">
                <button
                  onClick={() => handleSort('paymentMethod')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Method</span>
                  {getSortIcon('paymentMethod')}
                </button>
              </th>

              {/* Reference Column */}
              <th className="px-4 py-4 text-left min-w-[120px]">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                  Reference
                </span>
              </th>

              {/* Status Column */}
              <th className="px-4 py-4 text-left min-w-[100px]">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>

              {/* Reconciliation Column */}
              <th className="px-4 py-4 text-left min-w-[110px]">
                <button
                  onClick={() => handleSort('reconciliationStatus')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Reconciliation</span>
                  {getSortIcon('reconciliationStatus')}
                </button>
              </th>

              {/* Date Column */}
              <th className="px-4 py-4 text-left min-w-[120px]">
                <button
                  onClick={() => handleSort('processedAt')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Processed</span>
                  {getSortIcon('processedAt')}
                </button>
              </th>

              {/* Actions Column */}
              <th className="px-4 py-4 text-right min-w-[80px]">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedTransactions.map((transaction) => (
              <tr 
                key={transaction.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Transaction ID */}
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.id}
                  </span>
                </td>

                {/* Invoice ID */}
                <td className="px-4 py-4">
                  <button
                    onClick={() => onRowAction?.('view', transaction)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 
                             dark:hover:text-blue-300 hover:underline"
                  >
                    {transaction.invoiceId}
                  </button>
                </td>

                {/* Amount */}
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatAmountFromCents(transaction.amount)}
                  </span>
                </td>

                {/* Payment Method */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {getPaymentMethodLabel(transaction.paymentMethod)}
                  </span>
                </td>

                {/* Reference */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {transaction.reference || '-'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  {getStatusBadge(transaction.status)}
                </td>

                {/* Reconciliation */}
                <td className="px-4 py-4">
                  {getReconciliationBadge(transaction.reconciliationStatus)}
                </td>

                {/* Date */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(transaction.processedAt)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => onRowAction?.('reconcile', transaction)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 
                             dark:hover:text-blue-300 font-medium"
                  >
                    Reconcile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                         rounded hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                         rounded hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TransactionDataTable.displayName = 'TransactionDataTable';

export default TransactionDataTable;
