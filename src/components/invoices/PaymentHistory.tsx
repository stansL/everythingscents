'use client';

import React from 'react';
import { Payment, PaymentMethod } from '@/lib/services/invoices/types';

interface PaymentHistoryProps {
  payments: Payment[];
  className?: string;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  payments, 
  className = '' 
}) => {
  // Convert cents to display format
  const formatCurrency = (cents: number): string => {
    return `KES ${(cents / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
      case PaymentMethod.CASH:
        return 'Cash';
      case PaymentMethod.MPESA:
        return 'M-Pesa';
      case PaymentMethod.BANK_TRANSFER:
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  // Get payment method icon/badge color
  const getMethodColor = (method: PaymentMethod): string => {
    switch (method) {
      case PaymentMethod.CASH:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case PaymentMethod.MPESA:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case PaymentMethod.BANK_TRANSFER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Calculate total paid
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (payments.length === 0) {
    return (
      <div className={`rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Payment History
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No payments recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-black dark:text-white">
          Payment History
        </h3>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
          <p className="text-base font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="relative border-l-4 border-primary pl-4 pb-3 last:pb-0"
          >
            {/* Timeline dot */}
            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full border-2 border-white bg-primary dark:border-boxdark" />
            
            {/* Payment details */}
            <div className="rounded-lg border border-stroke bg-gray-50 p-3 dark:border-strokedark dark:bg-meta-4">
              <div className="mb-1 flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-black dark:text-white">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(payment.processedAt)}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getMethodColor(payment.method)}`}>
                  {getPaymentMethodLabel(payment.method)}
                </span>
              </div>
              
              {payment.reference && (
                <div className="mt-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Ref: {payment.reference}
                  </p>
                </div>
              )}
              
              {payment.notes && (
                <div className="mt-1">
                  <p className="text-xs italic text-gray-600 dark:text-gray-400">
                    {payment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment count */}
      <div className="mt-3 border-t border-stroke pt-3 dark:border-strokedark">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded
        </p>
      </div>
    </div>
  );
};

export default PaymentHistory;
