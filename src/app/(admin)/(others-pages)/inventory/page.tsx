"use client";

import React, { useState } from 'react';
import { 
  InventoryDashboard, 
  StockReplenishmentForm, 
  InventoryAdjustmentForm,
  ReorderAlertsDashboard,
  SupplierPerformanceSummary
} from '@/components/inventory';
import { useModal } from '@/hooks/useModal';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';

const InventoryPage: React.FC = () => {
  const replenishmentModal = useModal();
  const adjustmentModal = useModal();
  
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionSuccess = () => {
    // Refresh the dashboard when a transaction is completed
    setRefreshKey(prev => prev + 1);
    replenishmentModal.close();
    adjustmentModal.close();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageBreadCrumb 
            pageName="Inventory Dashboard" 
            items={[
              { name: "Admin", path: "/" },
              { name: "Inventory Management", path: "/inventory" }
            ]} 
          />
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor stock levels, track inventory movements, and manage your warehouse operations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={adjustmentModal.open}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Stock Adjustment
          </button>
          <button
            onClick={replenishmentModal.open}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Stock
          </button>
        </div>
      </div>

      {/* Main Dashboard */}
      <InventoryDashboard key={refreshKey} />

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Reorder Alerts */}
        <ReorderAlertsDashboard 
          onViewAll={() => window.location.href = '/inventory/reports?tab=alerts'}
        />

        {/* Supplier Performance Summary */}
        <SupplierPerformanceSummary />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Transaction History</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">View all inventory movements and transactions</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Suppliers</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage supplier relationships and contacts</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Purchase Orders</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage purchase orders</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Generate inventory and valuation reports</p>
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

export default InventoryPage;