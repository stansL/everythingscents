'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { Invoice } from '@/lib/services/invoices/types';
import { formatAmountFromCents } from '@/lib/utils/formatters';

interface AgingMetrics {
  current: {
    count: number;
    amount: number;
  };
  days30: {
    count: number;
    amount: number;
  };
  days60: {
    count: number;
    amount: number;
  };
  over60: {
    count: number;
    amount: number;
  };
  totalOutstanding: number;
  totalCount: number;
}

interface OutstandingInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  status: string;
}

type SortField = 'clientName' | 'amount' | 'dueDate' | 'daysOverdue';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function OutstandingInvoicesReport() {
  const [metrics, setMetrics] = useState<AgingMetrics>({
    current: { count: 0, amount: 0 },
    days30: { count: 0, amount: 0 },
    days60: { count: 0, amount: 0 },
    over60: { count: 0, amount: 0 },
    totalOutstanding: 0,
    totalCount: 0,
  });
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'daysOverdue', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const calculateDaysOverdue = (dueDate: Date): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateOutstandingMetrics = (allInvoices: Invoice[]): AgingMetrics => {
    const outstanding: AgingMetrics = {
      current: { count: 0, amount: 0 },
      days30: { count: 0, amount: 0 },
      days60: { count: 0, amount: 0 },
      over60: { count: 0, amount: 0 },
      totalOutstanding: 0,
      totalCount: 0,
    };

    const outstandingInvoicesList: OutstandingInvoice[] = [];

    allInvoices.forEach((invoice) => {
      // Filter for unpaid invoices (not paid, not cancelled)
      if (
        invoice.workflowStatus !== 'paid' &&
        invoice.workflowStatus !== 'cancelled' &&
        invoice.dueDate
      ) {
        const daysOverdue = calculateDaysOverdue(invoice.dueDate);
        // Calculate paid amount from payments array
        const totalPaid = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const unpaidAmount = invoice.amount - totalPaid;

        // Add to outstanding list
        outstandingInvoicesList.push({
          id: invoice.id,
          clientName: invoice.clientName,
          amount: unpaidAmount,
          dueDate: invoice.dueDate,
          daysOverdue: daysOverdue,
          status: invoice.workflowStatus,
        });

        // Categorize by aging bucket
        if (daysOverdue < 0) {
          // Not yet due
          outstanding.current.count++;
          outstanding.current.amount += unpaidAmount;
        } else if (daysOverdue <= 30) {
          // 0-30 days overdue
          outstanding.days30.count++;
          outstanding.days30.amount += unpaidAmount;
        } else if (daysOverdue <= 60) {
          // 31-60 days overdue
          outstanding.days60.count++;
          outstanding.days60.amount += unpaidAmount;
        } else {
          // 60+ days overdue
          outstanding.over60.count++;
          outstanding.over60.amount += unpaidAmount;
        }

        outstanding.totalOutstanding += unpaidAmount;
        outstanding.totalCount++;
      }
    });

    // Sort invoices by days overdue (most overdue first)
    outstandingInvoicesList.sort((a, b) => b.daysOverdue - a.daysOverdue);
    setInvoices(outstandingInvoicesList);

    return outstanding;
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset to first page on sort
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return (
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const sortedAndPaginatedInvoices = useMemo(() => {
    // Sort invoices
    const sorted = [...invoices].sort((a, b) => {
      let aValue: string | number | Date = a[sortConfig.field];
      let bValue: string | number | Date = b[sortConfig.field];

      // Handle date comparison
      if (sortConfig.field === 'dueDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [invoices, sortConfig, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const loadOutstandingData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await InvoiceService.getAllInvoices();

      if (response.success && response.data) {
        const calculatedMetrics = calculateOutstandingMetrics(response.data);
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error('Error loading outstanding invoices:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOutstandingData();
  }, [loadOutstandingData]);

  const getAgingIcon = (type: string) => {
    switch (type) {
      case 'current':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (daysOverdue: number) => {
    if (daysOverdue < 0) {
      return (
        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Current
        </span>
      );
    } else if (daysOverdue <= 30) {
      return (
        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          {daysOverdue}d overdue
        </span>
      );
    } else if (daysOverdue <= 60) {
      return (
        <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          {daysOverdue}d overdue
        </span>
      );
    } else {
      return (
        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
          {daysOverdue}d overdue
        </span>
      );
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Outstanding Invoices
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track unpaid invoices with aging analysis
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Outstanding Summary */}
          <div className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2.5">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold">Total Outstanding</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatAmountFromCents(metrics.totalOutstanding)}
                </p>
                <p className="text-xs opacity-90">
                  {metrics.totalCount} invoices
                </p>
              </div>
            </div>
          </div>

          {/* Aging Breakdown */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {/* Current (Not Yet Due) */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2.5 dark:bg-green-900/40">
                    <div className="text-green-600 dark:text-green-400">
                      {getAgingIcon('current')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Current</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Not yet due</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatAmountFromCents(metrics.current.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.current.count} invoices
                  </p>
                </div>
              </div>
            </div>

            {/* 0-30 Days */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-yellow-100 p-2.5 dark:bg-yellow-900/40">
                    <div className="text-yellow-600 dark:text-yellow-400">
                      {getAgingIcon('warning')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">0-30 Days</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Recently overdue</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatAmountFromCents(metrics.days30.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.days30.count} invoices
                  </p>
                </div>
              </div>
            </div>

            {/* 31-60 Days */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 p-2.5 dark:bg-orange-900/40">
                    <div className="text-orange-600 dark:text-orange-400">
                      {getAgingIcon('alert')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">31-60 Days</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Needs attention</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatAmountFromCents(metrics.days60.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.days60.count} invoices
                  </p>
                </div>
              </div>
            </div>

            {/* 60+ Days */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2.5 dark:bg-red-900/40">
                    <div className="text-red-600 dark:text-red-400">
                      {getAgingIcon('alert')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">60+ Days</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Critical</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatAmountFromCents(metrics.over60.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.over60.count} invoices
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Outstanding Invoices List */}
          {invoices.length > 0 ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          #
                        </th>
                        <th 
                          className="px-3 py-2 text-left text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort('clientName')}
                        >
                          <div className="flex items-center gap-1">
                            Client
                            {getSortIcon('clientName')}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-right text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Amount
                            {getSortIcon('amount')}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-left text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort('dueDate')}
                        >
                          <div className="flex items-center gap-1">
                            Due Date
                            {getSortIcon('dueDate')}
                          </div>
                        </th>
                        <th 
                          className="px-3 py-2 text-left text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleSort('daysOverdue')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {getSortIcon('daysOverdue')}
                          </div>
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Invoice ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sortedAndPaginatedInvoices.map((invoice, index) => (
                        <tr
                          key={invoice.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {invoice.clientName}
                          </td>
                          <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                            {formatAmountFromCents(invoice.amount)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {getStatusBadge(invoice.daysOverdue)}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                            >
                              #{invoice.id.slice(0, 8)}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length} invoices
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-700/30">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                No Outstanding Invoices
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All invoices have been paid or cancelled
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
