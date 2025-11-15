'use client';

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@/icons';
import { Invoice } from '@/lib/services/invoices/types';
import { formatAmountFromCents, formatDate, getStatusColor } from '@/lib/utils/formatters';

export interface SortConfig {
  key: keyof Invoice;
  direction: 'asc' | 'desc';
}

interface InvoiceDataTableProps {
  invoices: Invoice[];
  loading?: boolean;
  sortConfig?: SortConfig;
  onSort?: (key: SortConfig['key']) => void;
  onRowAction?: (action: 'view' | 'delete', invoice: Invoice) => void;
  selectedInvoices?: string[];
  onSelectInvoice?: (invoiceId: string) => void;
  onSelectAll?: (checked: boolean) => void;
}

export const InvoiceDataTable: React.FC<InvoiceDataTableProps> = React.memo(({
  invoices,
  loading = false,
  sortConfig,
  onSort,
  onRowAction,
  selectedInvoices = [],
  onSelectInvoice,
  onSelectAll
}) => {

  const handleSort = (key: SortConfig['key']) => {
    if (onSort) {
      onSort(key);
    }
  };

  const getSortIcon = (key: SortConfig['key']) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUpIcon className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUpIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" /> :
      <ChevronDownIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />;
  };

  const handleRowAction = (action: 'view' | 'delete', invoice: Invoice) => {
    if (onRowAction) {
      onRowAction(action, invoice);
    }
  };

  const allSelected = selectedInvoices.length === invoices.length && invoices.length > 0;
  const someSelected = selectedInvoices.length > 0 && selectedInvoices.length < invoices.length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="animate-pulse">
          {/* Table Header Skeleton */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded flex-1"></div>
              ))}
            </div>
          </div>
          {/* Table Rows Skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-t border-gray-200 dark:border-gray-600 px-6 py-4">
              <div className="flex space-x-4">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 dark:bg-gray-700 rounded flex-1"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            No invoices found matching your criteria.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* Checkbox Column */}
              <th className="px-6 py-4 text-left w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  aria-label={allSelected ? "Deselect all invoices" : someSelected ? "Select all invoices" : "Select all invoices"}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded 
                           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                           transition-colors duration-200"
                />
              </th>
              
              {/* Invoice Column */}
              <th className="px-3 py-4 text-left w-24">
                <button
                  onClick={() => handleSort('id')}
                  aria-label={`Sort by invoice ${sortConfig?.key === 'id' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white
                           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                           transition-all duration-200 rounded px-1"
                >
                  <span>Invoice #</span>
                  {getSortIcon('id')}
                </button>
              </th>

              {/* Customer Column */}
              <th className="px-3 py-4 text-left w-32">
                <button
                  onClick={() => handleSort('clientName')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Customer</span>
                  {getSortIcon('clientName')}
                </button>
              </th>

              {/* Category Column */}
              <th className="px-3 py-4 text-left w-24">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Category</span>
                  {getSortIcon('category')}
                </button>
              </th>

              {/* Created Column */}
              <th className="px-3 py-4 text-left w-28">
                <button
                  onClick={() => handleSort('issueDate')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Issue Date</span>
                  {getSortIcon('issueDate')}
                </button>
              </th>

              {/* Due Date Column */}
              <th className="px-3 py-4 text-left w-28">
                <button
                  onClick={() => handleSort('dueDate')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Due Date</span>
                  {getSortIcon('dueDate')}
                </button>
              </th>

              {/* Amount Column */}
              <th className="px-3 py-4 text-left w-24">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Amount</span>
                  {getSortIcon('amount')}
                </button>
              </th>

              {/* Status Column */}
              <th className="px-3 py-4 text-left w-20">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 
                           tracking-wider hover:text-gray-900 dark:hover:text-white"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>

              {/* Actions Column */}
              <th className="px-3 py-4 text-left w-16">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {invoices.map((invoice, index) => (
              <tr 
                key={invoice.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:scale-[1.001]"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.3s ease-out forwards'
                }}
              >
                {/* Checkbox */}
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => onSelectInvoice?.(invoice.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded 
                             focus:ring-blue-500 dark:focus:ring-blue-600"
                  />
                </td>

                {/* Invoice Number */}
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRowAction('view', invoice);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium truncate hover:underline transition-colors cursor-pointer text-left"
                    title={`View Invoice #${invoice.id}`}
                    aria-label={`View invoice ${invoice.id}`}
                  >
                    #{invoice.id}
                  </button>
                </td>

                {/* Customer */}
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-900 dark:text-white truncate">
                    {invoice.clientName}
                  </div>
                </td>

                {/* Category */}
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate capitalize">
                    {invoice.category || 'N/A'}
                  </div>
                </td>

                {/* Issue Date */}
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-900 dark:text-white truncate">
                    {formatDate(invoice.issueDate)}
                  </div>
                </td>

                {/* Due Date */}
                <td className="px-3 py-3">
                  <div className="text-sm text-gray-900 dark:text-white truncate">
                    {formatDate(invoice.dueDate)}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-3 py-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    ${formatAmountFromCents(invoice.amount)}
                  </div>
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {/* View More Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRowAction('view', invoice);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="View More"
                      aria-label={`View invoice ${invoice.id}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRowAction('delete', invoice);
                      }}
                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete"
                      aria-label={`Delete invoice ${invoice.id}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

InvoiceDataTable.displayName = 'InvoiceDataTable';

export default InvoiceDataTable;