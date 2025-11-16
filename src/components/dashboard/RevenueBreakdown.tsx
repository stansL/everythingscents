"use client";
import { useState, useEffect, useCallback } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import { transactionService } from "@/lib/services/transactions/transactionService";
import { PaymentMethod } from "@/lib/services/invoices/types";
import { Transaction } from "@/lib/services/transactions/types";

interface RevenueStats {
  total: number;
  byMethod: {
    cash: number;
    mpesa: number;
    bankTransfer: number;
  };
  dailyAverage: number;
  weeklyTotal: number;
  monthlyTotal: number;
}

export default function RevenueBreakdown() {
  const [stats, setStats] = useState<RevenueStats>({
    total: 0,
    byMethod: { cash: 0, mpesa: 0, bankTransfer: 0 },
    dailyAverage: 0,
    weeklyTotal: 0,
    monthlyTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const loadRevenueStats = useCallback(async () => {
    setLoading(true);
    try {
      const transactions = await transactionService.getTransactions();
      if (transactions) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Filter transactions by period
        let filteredTransactions = transactions;
        if (period === 'today') {
          filteredTransactions = transactions.filter((t: Transaction) => {
            const transactionDate = t.createdAt instanceof Date ? t.createdAt : new Date();
            return transactionDate >= startOfDay;
          });
        } else if (period === 'week') {
          filteredTransactions = transactions.filter((t: Transaction) => {
            const transactionDate = t.createdAt instanceof Date ? t.createdAt : new Date();
            return transactionDate >= startOfWeek;
          });
        } else if (period === 'month') {
          filteredTransactions = transactions.filter((t: Transaction) => {
            const transactionDate = t.createdAt instanceof Date ? t.createdAt : new Date();
            return transactionDate >= startOfMonth;
          });
        }

        // Calculate totals
        const total = filteredTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        
        // Calculate by payment method
        const byMethod = {
          cash: filteredTransactions
            .filter((t: Transaction) => t.paymentMethod === PaymentMethod.CASH)
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          mpesa: filteredTransactions
            .filter((t: Transaction) => t.paymentMethod === PaymentMethod.MPESA)
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          bankTransfer: filteredTransactions
            .filter((t: Transaction) => t.paymentMethod === PaymentMethod.BANK_TRANSFER)
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
        };

        // Calculate weekly and monthly totals
        const weekTransactions = transactions.filter((t: Transaction) => {
          const transactionDate = t.createdAt instanceof Date ? t.createdAt : new Date();
          return transactionDate >= startOfWeek;
        });
        const monthTransactions = transactions.filter((t: Transaction) => {
          const transactionDate = t.createdAt instanceof Date ? t.createdAt : new Date();
          return transactionDate >= startOfMonth;
        });

        const weeklyTotal = weekTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const monthlyTotal = monthTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const dailyAverage = monthlyTotal / now.getDate();

        setStats({
          total,
          byMethod,
          dailyAverage,
          weeklyTotal,
          monthlyTotal,
        });
      }
    } catch (error) {
      console.error('Error loading revenue stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadRevenueStats();
  }, [loadRevenueStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMethodPercentage = (amount: number) => {
    return stats.total > 0 ? ((amount / stats.total) * 100).toFixed(1) : '0.0';
  };

  return (
    <ComponentCard
      title="Revenue Breakdown"
      className="h-full"
      action={
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1 text-sm rounded ${
              period === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm rounded ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm rounded ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Month
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total Revenue */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(stats.total)}
            </p>
          </div>

          {/* Payment Method Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Payment Methods
            </h4>
            <div className="space-y-3">
              {/* Cash */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cash</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.byMethod.cash)} ({getMethodPercentage(stats.byMethod.cash)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getMethodPercentage(stats.byMethod.cash)}%` }}
                  />
                </div>
              </div>

              {/* M-Pesa */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">M-Pesa</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.byMethod.mpesa)} ({getMethodPercentage(stats.byMethod.mpesa)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getMethodPercentage(stats.byMethod.mpesa)}%` }}
                  />
                </div>
              </div>

              {/* Bank Transfer */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bank Transfer</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.byMethod.bankTransfer)} ({getMethodPercentage(stats.byMethod.bankTransfer)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getMethodPercentage(stats.byMethod.bankTransfer)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Avg</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.dailyAverage)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Week Total</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.weeklyTotal)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Month Total</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(stats.monthlyTotal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </ComponentCard>
  );
}
