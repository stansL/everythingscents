"use client";

import React, { useState } from 'react';
import { InventoryTransactionHistory, StockReplenishmentForm, InventoryAdjustmentForm } from '@/components/inventory';
import { useModal } from '@/hooks/useModal';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import { InventoryTransactionType } from '@/lib/services/products/types';

const StockTransactionsPage: React.FC = () => {
  const replenishmentModal = useModal();
  const adjustmentModal = useModal();
  
  const [filterType, setFilterType] = useState<InventoryTransactionType | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionSuccess = () => {
    // Refresh the transaction history when a transaction is completed
    setRefreshKey(prev => prev + 1);
    replenishmentModal.closeModal();
    adjustmentModal.closeModal();
  };

  const transactionTypes = [
    { value: undefined, label: 'All Transactions' },
    { value: 'purchase' as const, label: 'Purchases' },
    { value: 'sale' as const, label: 'Sales' },
    { value: 'adjustment' as const, label: 'Adjustments' },
    { value: 'transfer_in' as const, label: 'Transfer In' },
    { value: 'transfer_out' as const, label: 'Transfer Out' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <PageBreadCrumb pageTitle="Stock Transactions" />
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track all inventory movements and manage stock adjustments.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={adjustmentModal.openModal}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Stock Adjustment
          </button>
          <button
            onClick={replenishmentModal.openModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Stock
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Type
            </label>
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value as InventoryTransactionType || undefined)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {transactionTypes.map((type) => (
                <option key={type.value || 'all'} value={type.value || ''}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterType(undefined);
                setRefreshKey(prev => prev + 1);
              }}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <InventoryTransactionHistory 
        key={refreshKey}
        transactionType={filterType}
        limit={100}
      />

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">0</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Stock Additions Today</p>
          <div className="mt-2">
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">+0.0%</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">0</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Adjustments Today</p>
          <div className="mt-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Last: Never</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$0.00</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Transaction Value Today</p>
          <div className="mt-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Total: $0.00</span>
          </div>
        </div>
      </div>

      {/* Stock Replenishment Modal */}
      {replenishmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StockReplenishmentForm
              onSuccess={handleTransactionSuccess}
              onCancel={replenishmentModal.closeModal}
            />
          </div>
        </div>
      )}

      {/* Inventory Adjustment Modal */}
      {adjustmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <InventoryAdjustmentForm
              onSuccess={handleTransactionSuccess}
              onCancel={adjustmentModal.closeModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransactionsPage;