'use client';

import React, { useState, useEffect } from 'react';
import { SuppliersList } from '@/components/inventory/SuppliersList';
import { SupplierService } from '@/lib/services/inventory/supplierService';
import { Supplier } from '@/lib/services/products/types';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await SupplierService.getAllSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(supplier => supplier.isActive).length;
  const pendingOrders = 0; // This would need to be calculated from orders data
  const totalSpent = 0; // This would need to be calculated from purchase orders data
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <PageBreadCrumb pageTitle="Suppliers" />
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage supplier relationships, contact information, and payment terms.
        </p>
      </div>

      {/* Suppliers Management */}
      <SuppliersList />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : totalSuppliers}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Suppliers</p>
                </div>
              </div>
              <div className="ml-13">
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  {activeSuppliers} Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : activeSuppliers}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Suppliers</p>
                </div>
              </div>
              <div className="ml-13">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  Ready to Order
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : pendingOrders}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Orders</p>
                </div>
              </div>
              <div className="ml-13">
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                  In Progress
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${loading ? '...' : totalSpent}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                </div>
              </div>
              <div className="ml-13">
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                  This Month
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}