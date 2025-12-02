'use client';

import React, { useState } from 'react';
import { PaymentMethod } from '@/lib/services/invoices/types';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { paymentService } from '@/lib/services/payments/paymentService';
import { PaymentProvider } from '@/lib/services/payments/types';

interface PaymentRecordingFormProps {
  invoiceId: string;
  remainingBalance: number; // In cents
  customerPhone?: string;
  customerEmail?: string;
  onPaymentRecorded?: () => void;
  onClose?: () => void;
  className?: string;
}

const PaymentRecordingForm: React.FC<PaymentRecordingFormProps> = ({
  invoiceId,
  remainingBalance,
  customerPhone,
  customerEmail,
  onPaymentRecorded,
  onClose,
  className = '',
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [phoneNumber, setPhoneNumber] = useState<string>(customerPhone || '');
  const [email, setEmail] = useState<string>(customerEmail || '');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

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

    // Validate phone number for mobile money
    if (paymentMethod === PaymentMethod.MPESA || paymentMethod === PaymentMethod.AIRTEL_MONEY) {
      if (!phoneNumber || !/^254\d{9}$/.test(phoneNumber)) {
        setError('Please enter a valid Kenyan phone number (254XXXXXXXXX)');
        return false;
      }
    }

    // Validate email for card payments
    if (paymentMethod === PaymentMethod.PAYSTACK) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    return true;
  };

  const getPaymentProvider = (): PaymentProvider | null => {
    switch (paymentMethod) {
      case PaymentMethod.MPESA:
        return PaymentProvider.MPESA;
      case PaymentMethod.AIRTEL_MONEY:
        return PaymentProvider.AIRTEL_MONEY;
      case PaymentMethod.PAYSTACK:
        return PaymentProvider.PAYSTACK;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const provider = getPaymentProvider();

    // For cash and bank transfers, record payment directly
    if (!provider) {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
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
            }, 1500);
          }
        } else {
          setError(response.error || 'Failed to record payment');
        }
      } catch {
        setError('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For electronic payments (M-Pesa, Airtel Money, Paystack)
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setPaymentUrl(null);

    try {
      const result = await paymentService.processPayment(provider, {
        amount: amountInCents,
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        currency: 'KES',
        reference: invoiceId,
        description: `Payment for Invoice ${invoiceId}`,
        metadata: {
          invoiceId,
          paymentMethod,
        },
      });

      if (result.success) {
        if (result.checkoutUrl) {
          // Paystack - show payment link
          setPaymentUrl(result.checkoutUrl);
          setSuccessMessage('Payment link generated! Opening checkout page...');
          setTimeout(() => {
            window.open(result.checkoutUrl, '_blank');
          }, 1000);
        } else {
          // M-Pesa/Airtel - STK Push sent
          setSuccessMessage(
            `${paymentMethod === PaymentMethod.MPESA ? 'M-Pesa' : 'Airtel Money'} payment request sent! ` +
            'Please check your phone to complete the payment.'
          );
          
          // Close form after delay to let user see message
          if (onClose) {
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        }
        
        // Notify parent to refresh invoice
        if (onPaymentRecorded) {
          setTimeout(() => {
            onPaymentRecorded();
          }, 2000);
        }
      } else {
        setError(result.error || `Failed to initiate ${paymentMethod} payment`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred while processing payment');
    } finally {
      setIsProcessing(false);
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
              disabled={isSubmitting || isProcessing}
            >
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.MPESA}>M-Pesa</option>
              <option value={PaymentMethod.AIRTEL_MONEY}>Airtel Money</option>
              <option value={PaymentMethod.PAYSTACK}>Card Payment (Paystack)</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Phone Number (for M-Pesa/Airtel Money) */}
        {(paymentMethod === PaymentMethod.MPESA || paymentMethod === PaymentMethod.AIRTEL_MONEY) && (
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Phone Number <span className="text-red">*</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="254712345678"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              disabled={isSubmitting || isProcessing}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: 254XXXXXXXXX
            </p>
          </div>
        )}

        {/* Email (for Card Payments) */}
        {paymentMethod === PaymentMethod.PAYSTACK && (
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Email Address <span className="text-red">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              disabled={isSubmitting || isProcessing}
            />
          </div>
        )}

        {/* Reference Input (Optional) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Reference
            {paymentMethod === PaymentMethod.MPESA && <span className="text-xs text-gray-500"> (M-Pesa Code)</span>}
            {paymentMethod === PaymentMethod.AIRTEL_MONEY && <span className="text-xs text-gray-500"> (Airtel Ref)</span>}
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction ID"
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            disabled={isSubmitting || isProcessing}
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
            disabled={isSubmitting || isProcessing}
          />
        </div>

        {/* Payment URL (for Paystack) */}
        {paymentUrl && (
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">Payment link:</p>
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 underline break-all"
            >
              {paymentUrl}
            </a>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setAmount('');
              setReference('');
              setNotes('');
              setError(null);
              setPaymentUrl(null);
            }}
            className="rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
            disabled={isSubmitting || isProcessing}
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-6 py-2 font-medium transition-colors disabled:opacity-50"
            disabled={isSubmitting || isProcessing}
          >
            {isSubmitting || isProcessing 
              ? (paymentMethod === PaymentMethod.MPESA || paymentMethod === PaymentMethod.AIRTEL_MONEY 
                  ? 'Sending...' 
                  : paymentMethod === PaymentMethod.PAYSTACK 
                    ? 'Generating...' 
                    : 'Recording...')
              : paymentMethod === PaymentMethod.CASH || paymentMethod === PaymentMethod.BANK_TRANSFER
                ? 'Record Payment'
                : `Pay with ${paymentMethod === PaymentMethod.MPESA ? 'M-Pesa' : paymentMethod === PaymentMethod.AIRTEL_MONEY ? 'Airtel' : 'Card'}`
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentRecordingForm;
