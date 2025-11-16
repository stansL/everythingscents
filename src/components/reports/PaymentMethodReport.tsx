'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { Invoice } from '@/lib/services/invoices/types';
import { formatAmountFromCents } from '@/lib/utils/formatters';

interface PaymentMethodMetrics {
  cash: {
    count: number;
    amount: number;
    percentage: number;
  };
  mpesa: {
    count: number;
    amount: number;
    percentage: number;
  };
  bankTransfer: {
    count: number;
    amount: number;
    percentage: number;
  };
  totalTransactions: number;
  totalAmount: number;
}

export default function PaymentMethodReport() {
  const [metrics, setMetrics] = useState<PaymentMethodMetrics>({
    cash: { count: 0, amount: 0, percentage: 0 },
    mpesa: { count: 0, amount: 0, percentage: 0 },
    bankTransfer: { count: 0, amount: 0, percentage: 0 },
    totalTransactions: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await InvoiceService.getAllInvoices();
      
      if (response.success && response.data) {
        const invoices = response.data;
        const calculatedMetrics = calculatePaymentMetrics(invoices);
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const calculatePaymentMetrics = (invoices: Invoice[]): PaymentMethodMetrics => {
    const metrics = {
      cash: { count: 0, amount: 0, percentage: 0 },
      mpesa: { count: 0, amount: 0, percentage: 0 },
      bankTransfer: { count: 0, amount: 0, percentage: 0 },
      totalTransactions: 0,
      totalAmount: 0,
    };

    // Get all payments from all invoices
    invoices.forEach((invoice) => {
      if (invoice.payments && invoice.payments.length > 0) {
        invoice.payments.forEach((payment) => {
          metrics.totalTransactions++;
          metrics.totalAmount += payment.amount;

          switch (payment.method) {
            case 'cash':
              metrics.cash.count++;
              metrics.cash.amount += payment.amount;
              break;
            case 'mpesa':
              metrics.mpesa.count++;
              metrics.mpesa.amount += payment.amount;
              break;
            case 'bank_transfer':
              metrics.bankTransfer.count++;
              metrics.bankTransfer.amount += payment.amount;
              break;
          }
        });
      }
    });

    // Calculate percentages
    if (metrics.totalAmount > 0) {
      metrics.cash.percentage = (metrics.cash.amount / metrics.totalAmount) * 100;
      metrics.mpesa.percentage = (metrics.mpesa.amount / metrics.totalAmount) * 100;
      metrics.bankTransfer.percentage = (metrics.bankTransfer.amount / metrics.totalAmount) * 100;
    }

    return metrics;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'mpesa':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'bank':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Method Report
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Breakdown of payments by method
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading payment data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Summary */}
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2.5">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold">Total Payments Received</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatAmountFromCents(metrics.totalAmount)}
                </p>
                <p className="text-xs opacity-90">
                  {metrics.totalTransactions} transactions
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Cash */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2.5 dark:bg-green-900/40">
                    <div className="text-green-600 dark:text-green-400">
                      {getMethodIcon('cash')}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cash</h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatAmountFromCents(metrics.cash.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.cash.count} transactions
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Share</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.cash.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-green-500 dark:bg-green-400 transition-all duration-500"
                    style={{ width: `${metrics.cash.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* M-Pesa */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2.5 dark:bg-emerald-900/40">
                    <div className="text-emerald-600 dark:text-emerald-400">
                      {getMethodIcon('mpesa')}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">M-Pesa</h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatAmountFromCents(metrics.mpesa.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.mpesa.count} transactions
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Share</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.mpesa.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500"
                    style={{ width: `${metrics.mpesa.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2.5 dark:bg-blue-900/40">
                    <div className="text-blue-600 dark:text-blue-400">
                      {getMethodIcon('bank')}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Bank Transfer</h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatAmountFromCents(metrics.bankTransfer.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.bankTransfer.count} transactions
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Share</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.bankTransfer.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                    style={{ width: `${metrics.bankTransfer.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Payment Method
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Transactions
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total Amount
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      Cash
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                      {metrics.cash.count}
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatAmountFromCents(metrics.cash.amount)}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                      {metrics.cash.percentage.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      M-Pesa
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                      {metrics.mpesa.count}
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatAmountFromCents(metrics.mpesa.amount)}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                      {metrics.mpesa.percentage.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      Bank Transfer
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                      {metrics.bankTransfer.count}
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatAmountFromCents(metrics.bankTransfer.amount)}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                      {metrics.bankTransfer.percentage.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      Total
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                      {metrics.totalTransactions}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                      {formatAmountFromCents(metrics.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
