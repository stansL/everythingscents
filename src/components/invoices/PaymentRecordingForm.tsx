'use client';

import React, { useState } from 'react';
import { PaymentMethod } from '@/lib/services/invoices/types';

interface PaymentRecordingFormProps {
  invoiceId: string;
  remainingBalance: number; // In cents
  onPaymentRecorded?: () => void;
  className?: string;
}

const PaymentRecordingForm: React.FC<PaymentRecordingFormProps> = ({
  invoiceId,
  remainingBalance,
  onPaymentRecorded,
  className = '',
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert cents to display format
  const formatCurrency = (cents: number): string => {
    return `KES ${(cents / 100).toFixed(2)}`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className={`rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Record Payment
      </h3>

      <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Remaining Balance: {formatCurrency(remainingBalance)}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Payment Amount (KES) <span className="text-red">*</span>
          </label>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            disabled={isSubmitting}
          />
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Payment Method <span className="text-red">*</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            disabled={isSubmitting}
          >
            <option value={PaymentMethod.CASH}>Cash</option>
            <option value={PaymentMethod.MPESA}>M-Pesa</option>
            <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
          </select>
        </div>

        {/* Reference Input (Optional) */}
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Reference / Transaction ID
            {paymentMethod === PaymentMethod.MPESA && <span className="text-sm text-gray-500"> (e.g., M-Pesa Code)</span>}
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Optional"
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            disabled={isSubmitting}
          />
        </div>

        {/* Notes Input (Optional) */}
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this payment"
            rows={3}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
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
            className="rounded bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
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
