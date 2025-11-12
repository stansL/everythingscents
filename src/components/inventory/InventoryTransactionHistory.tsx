import React, { useState, useEffect, useCallback } from 'react';
import { InventoryService } from '@/lib/services/inventory/inventoryService';
import { 
  InventoryTransaction, 
  InventoryTransactionType 
} from '@/lib/services/products/types';

interface InventoryTransactionHistoryProps {
  productId?: string;
  transactionType?: InventoryTransactionType;
  limit?: number;
  className?: string;
}

export const InventoryTransactionHistory: React.FC<InventoryTransactionHistoryProps> = ({
  productId,
  transactionType,
  limit = 50,
  className = ''
}) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await InventoryService.getTransactionHistory({
        productId,
        type: transactionType,
        limit
      });

      if (response.success && response.data) {
        setTransactions(response.data || []);
        setTotalCount(response.data?.length || 0);
      } else {
        setError(response.error || 'Failed to load transaction history');
      }
    } catch (err) {
      setError('An error occurred while loading transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, transactionType, limit]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const getTransactionTypeIcon = (type: InventoryTransactionType) => {
    switch (type) {
      case 'purchase':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'sale':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case 'adjustment':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'transfer':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
    }
  };

  const getTransactionTypeLabel = (type: InventoryTransactionType) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'sale': return 'Sale';
      case 'adjustment': return 'Adjustment';
      case 'transfer': return 'Transfer';
      default: return 'Unknown';
    }
  };

  const getQuantityDisplay = (transaction: InventoryTransaction) => {
    const isPositive = ['purchase'].includes(transaction.type) || 
                      (transaction.type === 'transfer' && transaction.quantity > 0);
    const quantity = Math.abs(transaction.quantity);
    return {
      value: isPositive ? `+${quantity}` : `-${quantity}`,
      color: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    };
  };

  const formatDate = (timestamp: Date | { toDate?: () => Date } | null) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate ? 
      timestamp.toDate() : 
      timestamp instanceof Date ? timestamp : new Date();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={loadTransactions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transaction History
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {totalCount} total transactions
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Transactions Found</h4>
            <p className="text-gray-500 dark:text-gray-400">
              {productId ? 'This product has no transaction history yet.' : 'No transactions match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => {
              const quantityDisplay = getQuantityDisplay(transaction);
              
              return (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start gap-4">
                    {getTransactionTypeIcon(transaction.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                          {transaction.reference && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                              {transaction.reference}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${quantityDisplay.color}`}>
                            {quantityDisplay.value}
                          </div>
                          {transaction.unitCost && transaction.unitCost > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ${transaction.unitCost.toFixed(2)}/unit
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                          {!productId && transaction.productName && (
                            <span className="font-medium">{transaction.productName} • </span>
                          )}
                          {transaction.createdAt ? formatDate(transaction.createdAt) : 'No date'}
                        </div>
                        
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          Running Total: {transaction.runningTotal}
                        </div>
                      </div>
                      
                      {transaction.notes && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                          {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {transactions.length > 0 && totalCount > transactions.length && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={() => loadTransactions()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
          >
            Load More ({totalCount - transactions.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};