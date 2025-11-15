'use client';

import React, { useState } from 'react';
import { PaymentMethod } from '@/lib/services/invoices/types';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';

interface PaymentRecordingFormProps {
  invoiceId: string;
  remainingBalance: number; // In cents
  onPaymentRecorded?: () => void;
  onClose?: () => void;
  className?: string;
}

const PaymentRecordingForm: React.FC<PaymentRecordingFormProps> = ({
  invoiceId,
  remainingBalance,
  onPaymentRecorded,
  onClose,
  className = '',
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Convert cents to display format
  const formatCurrency = (cents: number): string => {
    return `KES ${(cents / 100).toFixed(2)}`;
  };

  // Handle pay full amount
  const handlePayFull = () => {
    setAmount((remainingBalance / 100).toFixed(2));
  };

  // Calculate remaining after current payment
  const getRemainingAfterPayment = (): number => {
    if (!amount || parseFloat(amount) <= 0) return remainingBalance;
    const amountInCents = Math.round(parseFloat(amount) * 100);
    return Math.max(0, remainingBalance - amountInCents);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const validateForm = (): boolean => {
    setError(null);
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid payment amount');
      return false;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (amountInCents > remainingBalance) {
      setError('Payment amount cannot exceed remaining balance');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      const response = await InvoiceService.recordPayment(invoiceId, {
        amount: amountInCents,
        method: paymentMethod,
        reference: reference.trim() || undefined,
        processedAt: new Date(),
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        setSuccessMessage('Payment recorded successfully!');
        // Clear form
        setAmount('');
        setReference('');
        setNotes('');
        setPaymentMethod(PaymentMethod.CASH);
        
        // Notify parent
        if (onPaymentRecorded) {
          onPaymentRecorded();
        }
        
        // Close modal after short delay
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        setError(response.error || 'Failed to record payment');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Amount & Payment Method - Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Amount (KES) <span className="text-red">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 pr-20 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handlePayFull}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
              >
                Pay Full
              </button>
            </div>
            {amount && parseFloat(amount) > 0 && getRemainingAfterPayment() > 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Pending: {formatCurrency(getRemainingAfterPayment())}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Method <span className="text-red">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              disabled={isSubmitting}
            >
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.MPESA}>M-Pesa</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Reference Input (Optional) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Reference
            {paymentMethod === PaymentMethod.MPESA && <span className="text-xs text-gray-500"> (M-Pesa Code)</span>}
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction ID"
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            disabled={isSubmitting}
          />
        </div>

        {/* Notes Input (Optional) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={2}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setAmount('');
              setReference('');
              setNotes('');
              setError(null);
            }}
            className="rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
            disabled={isSubmitting}
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-6 py-2 font-medium transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentRecordingForm;
