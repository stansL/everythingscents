'use client';

import React from 'react';
import { Order, OrderStatus, OrderSource } from '@/lib/services/orders/types';
import { formatDate } from '@/lib/utils/formatters';
import { Timestamp } from 'firebase/firestore';

interface OrderReviewCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const OrderReviewCard: React.FC<OrderReviewCardProps> = ({
  order,
  onStatusChange,
  showActions = false,
  compact = false,
}) => {
  // Helper to convert Timestamp to Date
  const toDate = (date: Date | Timestamp): Date => {
    if (date instanceof Timestamp) {
      return date.toDate();
    }
    return date;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    const statusStyles: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      ready: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300',
      out_for_delivery: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      picked_up: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      failed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    };

    const statusLabels: Record<OrderStatus, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      ready: 'Ready',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      picked_up: 'Picked Up',
      cancelled: 'Cancelled',
      failed: 'Failed',
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  // Source badge styling
  const getSourceBadge = (source: OrderSource) => {
    const sourceStyles: Record<OrderSource, string> = {
      pwa: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      admin: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      phone: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800',
      walk_in: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    };

    const sourceLabels: Record<OrderSource, string> = {
      pwa: '📱 PWA',
      admin: '💼 Admin',
      phone: '📞 Phone',
      walk_in: '🚶 Walk-in',
    };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${sourceStyles[source]}`}>
        {sourceLabels[source]}
      </span>
    );
  };

  // Status progression for PWA
  const getStatusProgress = (status: OrderStatus): number => {
    const progression: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 20,
      processing: 40,
      ready: 60,
      out_for_delivery: 80,
      delivered: 100,
      picked_up: 100,
      cancelled: 0,
      failed: 0,
    };
    return progression[status] || 0;
  };

  const progress = getStatusProgress(order.status);
  const isCompleted = order.status === OrderStatus.DELIVERED || order.status === OrderStatus.PICKED_UP;
  const isCancelled = order.status === OrderStatus.CANCELLED || order.status === OrderStatus.FAILED;

  if (compact) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{order.orderNumber}</h3>
              {getSourceBadge(order.source)}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{order.customerName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{formatDate(toDate(order.createdAt))}</p>
          </div>
          <div className="text-right">
            {getStatusBadge(order.status)}
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{order.orderNumber}</h2>
              {getSourceBadge(order.source)}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Placed on {formatDate(toDate(order.createdAt))}
            </p>
          </div>
          <div className="text-right">
            {getStatusBadge(order.status)}
            {order.invoiceId && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                ✅ Converted to Invoice
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Progress Bar (for PWA) */}
      {!isCancelled && (
        <div className="px-6 py-4">
          <div className="mb-2 flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
            <span>Order Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Customer Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Name:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Phone:</span>
            <a href={`tel:${order.customerPhone}`} className="font-medium text-primary hover:underline">
              {order.customerPhone}
            </a>
          </div>
          {order.customerEmail && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <a href={`mailto:${order.customerEmail}`} className="font-medium text-primary hover:underline">
                {order.customerEmail}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Information */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Delivery Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Method:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
            </span>
          </div>
          {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Address:</span>
              <span className="max-w-xs text-right font-medium text-gray-900 dark:text-gray-100">
                {order.deliveryAddress}
              </span>
            </div>
          )}
          {order.deliveryNotes && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Notes:</span>
              <span className="max-w-xs text-right text-gray-700 dark:text-gray-300">
                {order.deliveryNotes}
              </span>
            </div>
          )}
          {order.estimatedDeliveryDate && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Estimated:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(toDate(order.estimatedDeliveryDate))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Order Items
        </h3>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{item.productName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(item.unitPrice)} × {item.quantity}
                </p>
                {item.notes && (
                  <p className="text-xs italic text-gray-400 dark:text-gray-500">{item.notes}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.totalPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="px-6 py-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountPercentage > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Discount ({order.discountPercentage}%):</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(order.subtotal * (order.discountPercentage / 100))}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tax (16%):</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-gray-700">
            <span className="text-gray-900 dark:text-gray-100">Total:</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mt-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900/50">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.isPaid
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
              }`}
            >
              {order.isPaid ? '✓ Paid' : 'Unpaid'}
            </span>
          </div>
          {order.paymentMethod && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Method: {order.paymentMethod}
              {order.paymentReference && ` • Ref: ${order.paymentReference}`}
            </p>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/10">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300">Order Notes:</p>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && onStatusChange && !isCancelled && !isCompleted && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/50">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Update Status</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {order.status === OrderStatus.PENDING && (
              <button
                onClick={() => onStatusChange(order.id, OrderStatus.CONFIRMED)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Confirm Order
              </button>
            )}
            {order.status === OrderStatus.CONFIRMED && (
              <button
                onClick={() => onStatusChange(order.id, OrderStatus.PROCESSING)}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Start Processing
              </button>
            )}
            {order.status === OrderStatus.PROCESSING && (
              <button
                onClick={() => onStatusChange(order.id, OrderStatus.READY)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
              >
                Mark Ready
              </button>
            )}
            {order.status === OrderStatus.READY && order.deliveryMethod === 'delivery' && (
              <button
                onClick={() => onStatusChange(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Out for Delivery
              </button>
            )}
            {order.status === OrderStatus.READY && order.deliveryMethod === 'pickup' && (
              <button
                onClick={() => onStatusChange(order.id, OrderStatus.PICKED_UP)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Mark Picked Up
              </button>
            )}
            {order.status === OrderStatus.OUT_FOR_DELIVERY && (
              <button
                onClick={() => onStatusChange(order.id, OrderStatus.DELIVERED)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Mark Delivered
              </button>
            )}
            <button
              onClick={() => onStatusChange(order.id, OrderStatus.CANCELLED)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Cancel Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderReviewCard;
