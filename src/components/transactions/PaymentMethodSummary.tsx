'use client';

import React, { useState, useEffect } from 'react';
import { transactionService } from '@/lib/services/transactions/transactionService';
import { TransactionSummary, TransactionFilters } from '@/lib/services/transactions/types';
import { formatAmountFromCents } from '@/lib/utils/formatters';
import { PaymentMethod } from '@/lib/services/invoices/types';

interface PaymentMethodSummaryProps {
  filters?: TransactionFilters;
}

export const PaymentMethodSummary: React.FC<PaymentMethodSummaryProps> = ({ filters }) => {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await transactionService.getTransactionSummary(filters);
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch transaction summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [filters]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Cash',
      [PaymentMethod.MPESA]: 'M-Pesa',
      [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
    };
    return labels[method];
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return (
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case PaymentMethod.MPESA:
        return (
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case PaymentMethod.BANK_TRANSFER:
        return (
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-600 dark:text-green-400',
        };
      case PaymentMethod.MPESA:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-600 dark:text-blue-400',
        };
      case PaymentMethod.BANK_TRANSFER:
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          border: 'border-purple-200 dark:border-purple-800',
          text: 'text-purple-600 dark:text-purple-400',
        };
    }
  };

  const paymentMethodData = Object.entries(summary.byPaymentMethod).map(([method, amount]) => ({
    method: method as PaymentMethod,
    amount,
    percentage: summary.totalAmount > 0 ? ((amount / summary.totalAmount) * 100) : 0,
  }));

  // Sort by amount descending
  paymentMethodData.sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Methods
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total: {formatAmountFromCents(summary.totalAmount)}
        </span>
      </div>

      {/* Payment Method Cards */}
      <div className="space-y-4">
        {paymentMethodData.map(({ method, amount, percentage }) => {
          const colors = getPaymentMethodColor(method);
          
          return (
            <div
              key={method}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`${colors.bg} rounded-lg p-3`}>
                    {getPaymentMethodIcon(method)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getPaymentMethodLabel(method)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {percentage.toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {formatAmountFromCents(amount)}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      method === PaymentMethod.CASH ? 'bg-green-600 dark:bg-green-400' :
                      method === PaymentMethod.MPESA ? 'bg-blue-600 dark:bg-blue-400' :
                      'bg-purple-600 dark:bg-purple-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chart visualization coming soon
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Payment method trends over time
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSummary;
