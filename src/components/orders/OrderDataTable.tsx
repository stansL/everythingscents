'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpIcon, ChevronDownIcon } from '@/icons';
import { Order, OrderStatus, OrderSource, OrderFilter } from '@/lib/services/orders/types';
import { formatDate } from '@/lib/utils/formatters';
import { OrderService } from '@/lib/services/orders/orderService';
import { Timestamp } from 'firebase/firestore';

export interface SortConfig {
  key: keyof Order;
  direction: 'asc' | 'desc';
}

interface OrderDataTableProps {
  filters?: OrderFilter;
  onRowAction?: (action: 'view' | 'edit' | 'convert', order: Order) => void;
}

export const OrderDataTable: React.FC<OrderDataTableProps> = React.memo(({
  filters,
  onRowAction,
}) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<OrderSource | 'all'>('all');
  const itemsPerPage = 10;

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const combinedFilters: OrderFilter = {
          ...filters,
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(sourceFilter !== 'all' && { source: sourceFilter }),
        };
        
        const response = await OrderService.getAllOrders(combinedFilters);
        if (response.success && response.data) {
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters, statusFilter, sourceFilter]);

  // Sort orders
  const sortedOrders = React.useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

      // Convert Timestamps and Dates to numeric timestamps for comparison
      let aCompare: number | string | boolean = 0;
      let bCompare: number | string | boolean = 0;

      if (aValue instanceof Timestamp) {
        aCompare = aValue.toDate().getTime();
      } else if (aValue instanceof Date) {
        aCompare = aValue.getTime();
      } else if (typeof aValue === 'string' || typeof aValue === 'number' || typeof aValue === 'boolean') {
        aCompare = aValue;
      } else {
        aCompare = String(aValue);
      }

      if (bValue instanceof Timestamp) {
        bCompare = bValue.toDate().getTime();
      } else if (bValue instanceof Date) {
        bCompare = bValue.getTime();
      } else if (typeof bValue === 'string' || typeof bValue === 'number' || typeof bValue === 'boolean') {
        bCompare = bValue;
      } else {
        bCompare = String(bValue);
      }

      // String comparison (case-insensitive for strings)
      if (typeof aCompare === 'string' && typeof bCompare === 'string') {
        const comparison = aCompare.toLowerCase().localeCompare(bCompare.toLowerCase());
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Numeric/boolean comparison
      if (aCompare < bCompare) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aCompare > bCompare) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [orders, sortConfig]);

  // Paginate orders
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedOrders, currentPage]);

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  // Handle sort
  const handleSort = (key: keyof Order) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Get sort icon
  const getSortIcon = (key: SortConfig['key']) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUpIcon className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUpIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" /> :
      <ChevronDownIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />;
  };

  // Get status badge color
  const getStatusBadgeColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      [OrderStatus.PROCESSING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      [OrderStatus.READY]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      [OrderStatus.OUT_FOR_DELIVERY]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      [OrderStatus.PICKED_UP]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      [OrderStatus.FAILED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get source badge color
  const getSourceBadgeColor = (source: OrderSource): string => {
    const colors: Record<OrderSource, string> = {
      [OrderSource.PWA]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      [OrderSource.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      [OrderSource.PHONE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      [OrderSource.WALK_IN]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Helper to convert Timestamp to Date
  const toDate = (date: Date | Timestamp): Date => {
    if (date instanceof Timestamp) {
      return date.toDate();
    }
    return date;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | 'all');
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">All Statuses</option>
            <option value={OrderStatus.PENDING}>Pending</option>
            <option value={OrderStatus.CONFIRMED}>Confirmed</option>
            <option value={OrderStatus.PROCESSING}>Processing</option>
            <option value={OrderStatus.READY}>Ready</option>
            <option value={OrderStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
            <option value={OrderStatus.DELIVERED}>Delivered</option>
            <option value={OrderStatus.PICKED_UP}>Picked Up</option>
            <option value={OrderStatus.CANCELLED}>Cancelled</option>
            <option value={OrderStatus.FAILED}>Failed</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Source
          </label>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as OrderSource | 'all');
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">All Sources</option>
            <option value={OrderSource.PWA}>PWA</option>
            <option value={OrderSource.ADMIN}>Admin</option>
            <option value={OrderSource.PHONE}>Phone</option>
            <option value={OrderSource.WALK_IN}>Walk-in</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('orderNumber')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Order #</span>
                  {getSortIcon('orderNumber')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('customerName')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Customer</span>
                  {getSortIcon('customerName')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Total</span>
                  {getSortIcon('total')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('source')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Source</span>
                  {getSortIcon('source')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <span>Date</span>
                  {getSortIcon('createdAt')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No orders found
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {order.customerPhone}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getSourceBadgeColor(order.source)}`}>
                      {order.source.toUpperCase()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(toDate(order.createdAt))}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        View
                      </button>
                      {!order.invoiceId && order.status !== OrderStatus.CANCELLED && (
                        <button
                          onClick={() => onRowAction?.('convert', order)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                        >
                          Convert
                        </button>
                      )}
                      {order.invoiceId && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Converted
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedOrders.length)} of {sortedOrders.length} orders
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

OrderDataTable.displayName = 'OrderDataTable';

export default OrderDataTable;
