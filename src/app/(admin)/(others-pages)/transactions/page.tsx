"use client";

import React, { useState } from "react";
import {
  ReconciliationDashboard,
  PaymentMethodSummary,
  MpesaTransactionMatcher,
  TransactionDataTable,
} from "@/components/transactions";
import { TransactionFilters } from "@/lib/services/transactions/types";

const TransactionsPage: React.FC = () => {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMatchComplete = () => {
    // Refresh all components after matching transactions
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transaction Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor and reconcile payment transactions across all channels
        </p>
      </div>

      {/* Dashboard Overview */}
      <ReconciliationDashboard key={`dashboard-${refreshKey}`} />

      {/* Payment Method Summary */}
      <PaymentMethodSummary key={`payment-${refreshKey}`} />

      {/* M-Pesa Transaction Matcher */}
      <MpesaTransactionMatcher
        key={`matcher-${refreshKey}`}
        onMatchComplete={handleMatchComplete}
      />

      {/* Transaction Data Table */}
      <TransactionDataTable
        key={`table-${refreshKey}`}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
};

export default TransactionsPage;
