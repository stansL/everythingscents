'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/services/orders/types';
import { Invoice, InvoiceItem, WorkflowStatus, DeliveryInfo, PaymentMethod } from '@/lib/services/invoices/types';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { OrderService } from '@/lib/services/orders/orderService';

interface OrderToInvoiceConverterProps {
  order: Order;
  onSuccess?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export const OrderToInvoiceConverter: React.FC<OrderToInvoiceConverterProps> = ({
  order,
  onSuccess,
  onCancel,
}) => {
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState(order.notes || '');

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const handleConvert = async () => {
    setError(null);
    setConverting(true);

    try {
      // Convert order items to invoice items
      const invoiceItems: InvoiceItem[] = order.items.map((item, index) => ({
        id: `item-${index + 1}`,
        description: item.productName + (item.notes ? ` (${item.notes})` : ''),
        quantity: item.quantity,
        rate: Math.round(item.unitPrice * 100), // Convert to cents
        amount: Math.round(item.totalPrice * 100), // Convert to cents
        discount: 0,
      }));

      // Convert delivery info
      const deliveryInfo: DeliveryInfo = {
        type: order.deliveryMethod,
        status: 'pending',
        scheduledDate: order.estimatedDeliveryDate 
          ? (order.estimatedDeliveryDate instanceof Date 
              ? order.estimatedDeliveryDate 
              : order.estimatedDeliveryDate.toDate())
          : undefined,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        address: order.deliveryAddress,
        notes: order.deliveryNotes,
      };

      // Create invoice from order
      const invoiceData = {
        clientName: order.customerName,
        clientEmail: order.customerEmail || '',
        clientAddress: order.deliveryAddress || '',
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        amount: Math.round(order.total * 100), // Convert to cents
        items: invoiceItems,
        subtotal: Math.round(order.subtotal * 100), // Convert to cents
        taxAmount: Math.round(order.tax * 100), // Convert to cents
        discountAmount: Math.round((order.subtotal * (order.discountPercentage / 100)) * 100), // Convert to cents
        status: order.isPaid ? ('paid' as const) : ('unpaid' as const),
        category: 'Order',
        description: `Converted from Order ${order.orderNumber}`,
        notes: notes || `Original order: ${order.orderNumber}`,
        workflowStatus: order.isPaid ? WorkflowStatus.PAID : WorkflowStatus.SENT,
        payments: order.isPaid && order.paymentMethod ? [{
          id: `payment-${Date.now()}`,
          amount: Math.round(order.total * 100),
          method: order.paymentMethod as PaymentMethod,
          reference: order.paymentReference,
          processedAt: new Date(),
          notes: `Payment from order ${order.orderNumber}`,
        }] : [],
        deliveryInfo,
        orderSource: order.source === 'pwa' ? ('pwa' as const) : 
                     order.source === 'admin' ? ('staff-assisted' as const) : 
                     ('walk-in' as const),
        paymentDueDate: new Date(dueDate),
        deliveryScheduledDate: order.estimatedDeliveryDate 
          ? (order.estimatedDeliveryDate instanceof Date 
              ? order.estimatedDeliveryDate 
              : order.estimatedDeliveryDate.toDate())
          : undefined,
      };

      // Create invoice
      const invoiceResponse = await InvoiceService.createInvoice(invoiceData);

      if (!invoiceResponse.success || !invoiceResponse.data) {
        throw new Error(invoiceResponse.error || 'Failed to create invoice');
      }

      // Update order with invoice ID
      const updateResponse = await OrderService.markAsConverted(order.id, invoiceResponse.data.id);

      if (!updateResponse.success) {
        console.error('Failed to update order with invoice ID:', updateResponse.error);
        // Don't throw here - invoice was created successfully
      }

      onSuccess?.(invoiceResponse.data);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert order to invoice');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Order Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Customer:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Items:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{order.items.length}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <span className="text-gray-900 dark:text-gray-100">Total Amount:</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Invoice Details
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="issueDate" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Issue Date *
            </label>
            <input
              type="date"
              id="issueDate"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              required
            />
          </div>
          <div>
            <label htmlFor="dueDate" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              required
            />
          </div>
          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invoice Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Additional notes for the invoice"
            />
          </div>
        </div>
      </div>

      {/* Items Preview */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Items to be Invoiced
        </h3>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700"
            >
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
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountPercentage > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Discount ({order.discountPercentage}%):</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(order.subtotal * (order.discountPercentage / 100))}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tax (16%):</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-gray-700">
            <span className="text-gray-900 dark:text-gray-100">Total:</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Warning */}
      {order.invoiceId && (
        <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          ⚠️ This order has already been converted to an invoice. Converting again will create a duplicate.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={converting}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConvert}
          disabled={converting}
          className="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {converting ? 'Converting...' : 'Convert to Invoice'}
        </button>
      </div>

      {/* Conversion Info */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <p className="font-medium">What happens next:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>A new invoice will be created with all order details</li>
          <li>The order will be marked as converted</li>
          <li>Customer information will be copied to the invoice</li>
          <li>Delivery information will be preserved</li>
          {order.isPaid && <li>Payment information will be recorded on the invoice</li>}
        </ul>
      </div>
    </div>
  );
};

export default OrderToInvoiceConverter;
