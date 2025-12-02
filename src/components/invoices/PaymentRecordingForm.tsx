'use client';

import React, { useState } from 'react';
import { PaymentMethod } from '@/lib/services/invoices/types';
import { PaymentProvider, PaymentRequest } from '@/lib/services/payments/types';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import PaymentMethodSelector from './PaymentMethodSelector';

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
  const [mode, setMode] = useState<'select' | 'process'>('select');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>(customerPhone || '');
  const [email, setEmail] = useState<string>(customerEmail || '');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'waiting' | 'success' | 'failed'>('idle');

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

    if (!selectedProvider) {
      setError('Please select a payment method');
      return false;
    }

    // Validate required fields per provider
    if (selectedProvider === PaymentProvider.MPESA || selectedProvider === PaymentProvider.AIRTEL_MONEY) {
      if (!phoneNumber || phoneNumber.length < 12) {
        setError('Please enter a valid phone number (254XXXXXXXXX)');
        return false;
      }
    }

    if (selectedProvider === PaymentProvider.PAYSTACK) {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    return true;
  };

  const handleMethodSelect = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    setMode('process');
    setError(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setPaymentStatus('waiting');

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      // Create payment request
      const paymentRequest: PaymentRequest = {
        amount: amountInCents,
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        currency: 'KES',
        reference: `INV-${invoiceId}`,
        description: `Payment for Invoice ${invoiceId}`,
        callbackUrl: `${window.location.origin}/invoices/${invoiceId}?payment=success`,
        metadata: {
          invoiceId,
          customerId: 'customer_id', // TODO: Get actual customer ID
        },
      };

      // Process payment through API route (server-side)
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          paymentRequest,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (selectedProvider === PaymentProvider.PAYSTACK && result.checkoutUrl) {
          // Redirect directly in same window to avoid popup blockers
          setSuccessMessage('Redirecting to payment page...');
          setPaymentStatus('waiting');
          
          // Store invoice ID in session storage so we can return to it
          sessionStorage.setItem('paystack_return_invoice', invoiceId);
          
          // Redirect to Paystack checkout (same window)
          window.location.href = result.checkoutUrl;
        } else if (selectedProvider === PaymentProvider.MPESA || selectedProvider === PaymentProvider.AIRTEL_MONEY) {
          // STK Push sent
          setSuccessMessage(`Payment request sent! Check your phone (${phoneNumber}) to complete payment.`);
          setPaymentStatus('waiting');
          
          // Note: Payment will be recorded via webhook when customer enters PIN
          setTimeout(() => {
            setSuccessMessage('Waiting for payment confirmation... This may take up to 2 minutes.');
          }, 3000);
        }
        
        // Close form after a delay (webhook will update invoice)
        setTimeout(() => {
          if (onPaymentRecorded) {
            onPaymentRecorded();
          }
          if (onClose) {
            onClose();
          }
        }, 5000);
      } else {
        setError(result.error || 'Failed to process payment');
        setPaymentStatus('failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setPaymentStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      // Map provider to payment method
      let method: PaymentMethod;
      switch (selectedProvider) {
        case PaymentProvider.MPESA:
          method = PaymentMethod.MPESA;
          break;
        case PaymentProvider.AIRTEL_MONEY:
          method = PaymentMethod.AIRTEL_MONEY;
          break;
        case PaymentProvider.PAYSTACK:
          method = PaymentMethod.PAYSTACK;
          break;
        default:
          method = PaymentMethod.CASH;
      }

      const response = await InvoiceService.recordPayment(invoiceId, {
        amount: amountInCents,
        method,
        reference: reference.trim() || undefined,
        processedAt: new Date(),
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        setSuccessMessage('Payment recorded successfully!');
        setPaymentStatus('success');
        
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
        setPaymentStatus('failed');
      }
    } catch {
      setError('An unexpected error occurred');
      setPaymentStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isManualMode = selectedProvider === null;

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {paymentStatus === 'waiting' && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-sm text-blue-800 dark:text-blue-200">Processing payment...</p>
        </div>
      )}

      {mode === 'select' && (
        <div>
          <PaymentMethodSelector
            phoneNumber={phoneNumber || customerPhone}
            email={email || customerEmail}
            onMethodSelect={handleMethodSelect}
            selectedProvider={selectedProvider}
          />
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode('process')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
            >
              Or record a manual payment
            </button>
          </div>
        </div>
      )}

      {mode === 'process' && (
        <form onSubmit={isManualMode ? handleRecordManualPayment : handleProcessPayment} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                setMode('select');
                setSelectedProvider(null);
                setError(null);
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Change Method
            </button>
            {selectedProvider && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedProvider === PaymentProvider.MPESA && 'M-Pesa'}
                {selectedProvider === PaymentProvider.AIRTEL_MONEY && 'Airtel Money'}
                {selectedProvider === PaymentProvider.PAYSTACK && 'Card Payment'}
              </span>
            )}
          </div>

          {/* Amount Input */}
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
                Remaining: {formatCurrency(getRemainingAfterPayment())}
              </p>
            )}
          </div>

          {/* Phone Number (for M-Pesa/Airtel) */}
          {(selectedProvider === PaymentProvider.MPESA || selectedProvider === PaymentProvider.AIRTEL_MONEY) && (
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Phone Number <span className="text-red">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="254712345678"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                STK push will be sent to this number
              </p>
            </div>
          )}

          {/* Email (for Paystack) */}
          {selectedProvider === PaymentProvider.PAYSTACK && (
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
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Payment receipt will be sent to this email
              </p>
            </div>
          )}

          {/* Reference (for manual recording) */}
          {isManualMode && (
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Transaction Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction ID or reference"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={2}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || paymentStatus === 'waiting'}
            >
              {isSubmitting ? 'Processing...' : isManualMode ? 'Record Payment' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentRecordingForm;
