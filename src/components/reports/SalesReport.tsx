'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { Invoice } from '@/lib/services/invoices/types';
import { formatAmountFromCents } from '@/lib/utils/formatters';
import { CustomDatePicker } from '@/components/form/CustomDatePicker';

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface SalesMetrics {
  totalSales: number;
  transactionCount: number;
  averageOrderValue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  sourceBreakdown: {
    'walk-in': number;
    'pwa': number;
    'staff-assisted': number;
  };
}

export default function SalesReport() {
  const [dateRange, setDateRange] = useState<DateRangeType>('month');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalSales: 0,
    transactionCount: 0,
    averageOrderValue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    sourceBreakdown: {
      'walk-in': 0,
      'pwa': 0,
      'staff-assisted': 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const loadSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await InvoiceService.getAllInvoices();
      
      if (response.success && response.data) {
        const invoices = response.data;
        const filteredInvoices = filterInvoicesByDateRange(invoices);
        const calculatedMetrics = calculateMetrics(filteredInvoices);
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error('Failed to load sales data:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const filterInvoicesByDateRange = (invoices: Invoice[]): Invoice[] => {
    const now = new Date();
    let filterStartDate: Date;
    let filterEndDate: Date = now;

    switch (dateRange) {
      case 'today':
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (!startDate || !endDate) return invoices;
        filterStartDate = startDate;
        filterEndDate = endDate;
        break;
      default:
        return invoices;
    }

    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= filterStartDate && invoiceDate <= filterEndDate;
    });
  };

  const calculateMetrics = (invoices: Invoice[]): SalesMetrics => {
    const paidInvoices = invoices.filter(
      (inv) => inv.workflowStatus === 'paid' || inv.status === 'paid'
    );
    const unpaidInvoices = invoices.filter(
      (inv) => inv.workflowStatus !== 'paid' && inv.status === 'unpaid'
    );

    const totalSales = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const transactionCount = paidInvoices.length;
    const averageOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0;

    // Calculate source breakdown from all invoices
    const sourceBreakdown = invoices.reduce(
      (acc, inv) => {
        const source = inv.orderSource || 'walk-in'; // Default to walk-in if not set
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      { 'walk-in': 0, 'pwa': 0, 'staff-assisted': 0 } as { 'walk-in': number; 'pwa': number; 'staff-assisted': number }
    );

    return {
      totalSales,
      transactionCount,
      averageOrderValue,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      sourceBreakdown,
    };
  };

  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRange(range);
    if (range !== 'custom') {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (!date) {
      setStartDate(null);
      return;
    }
    
    // Validate: no future dates
    if (date > today) {
      return;
    }
    
    // Validate: start date cannot be after end date
    if (endDate && date > endDate) {
      return;
    }
    
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (!date) {
      setEndDate(null);
      return;
    }
    
    // Validate: no future dates
    if (date > today) {
      return;
    }
    
    // Validate: end date cannot be before start date
    if (startDate && date < startDate) {
      return;
    }
    
    setEndDate(date);
  };

  const getTodayDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sales Report
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Overview of sales performance and revenue
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date Range
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDateRangeChange('today')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              dateRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleDateRangeChange('week')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('month')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              dateRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handleDateRangeChange('custom')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              dateRange === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <CustomDatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                placeholderText="Select start date"
                maxDate={endDate || getTodayDate()}
              />
              {startDate && endDate && startDate > endDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Start date cannot be after end date
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <CustomDatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                placeholderText="Select end date"
                minDate={startDate || undefined}
                maxDate={getTodayDate()}
              />
              {startDate && endDate && endDate < startDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  End date cannot be before start date
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading sales data...</p>
          </div>
        </div>
      ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Sales */}
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Sales
                </p>
                <p className="mt-2 text-xl font-bold text-blue-900 dark:text-blue-100">
                  {formatAmountFromCents(metrics.totalSales)}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-2.5 dark:bg-blue-900/40">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Transaction Count */}
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Transactions
                </p>
                <p className="mt-2 text-xl font-bold text-green-900 dark:text-green-100">
                  {metrics.transactionCount}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-2.5 dark:bg-green-900/40">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Avg. Order Value
                </p>
                <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-100">
                  {formatAmountFromCents(metrics.averageOrderValue)}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-2.5 dark:bg-purple-900/40">
                <svg
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Paid Invoices */}
          <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Paid Invoices
                </p>
                <p className="mt-2 text-xl font-bold text-emerald-900 dark:text-emerald-100">
                  {metrics.paidInvoices}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-2.5 dark:bg-emerald-900/40">
                <svg
                  className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Unpaid Invoices */}
          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Unpaid Invoices
                </p>
                <p className="mt-2 text-xl font-bold text-amber-900 dark:text-amber-100">
                  {metrics.unpaidInvoices}
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-2.5 dark:bg-amber-900/40">
                <svg
                  className="h-6 w-6 text-amber-600 dark:text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Sales by Source */}
          <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Sales by Source
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      PWA
                    </span>
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                      {metrics.sourceBreakdown.pwa}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Walk-in
                    </span>
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                      {metrics.sourceBreakdown['walk-in']}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Staff Assisted
                    </span>
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                      {metrics.sourceBreakdown['staff-assisted']}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-full bg-indigo-100 p-2.5 dark:bg-indigo-900/40">
                <svg
                  className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
