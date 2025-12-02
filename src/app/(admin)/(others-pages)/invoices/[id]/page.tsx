'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Invoice, DeliveryInfo } from '@/lib/services/invoices/types';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { formatAmountFromCents, formatDate, getStatusColor } from '@/lib/utils/formatters';
import { WorkflowStatusBadge, PaymentRecordingForm, PaymentHistory, DeliveryStatusToggle } from '@/components/invoices';
import { useModal } from '@/hooks/useModal';
import { Modal } from '@/components/ui/modal';

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { isOpen: isPaymentModalOpen, openModal: openPaymentModal, closeModal: closePaymentModal } = useModal();

  const loadInvoice = async () => {
    if (!invoiceId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await InvoiceService.getInvoiceById(invoiceId);
      
      if (response.success && response.data) {
        setInvoice(response.data);
      } else {
        setError(response.error || 'Invoice not found');
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
    
    // Check if returning from Paystack payment
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      setPaymentSuccess(true);
      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const handlePaymentRecorded = () => {
    // Reload invoice to get updated payment data
    loadInvoice();
  };

  const handleDeliveryUpdate = async (updatedInfo: DeliveryInfo) => {
    if (!invoice) return;
    
    const response = await InvoiceService.updateDeliveryInfo(invoiceId, updatedInfo);
    if (response.success && response.data) {
      setInvoice(response.data);
    }
  };

  // Calculate remaining balance
  const getRemainingBalance = (): number => {
    if (!invoice) return 0;
    const totalPaid = (invoice.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
    return invoice.amount - totalPaid;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb 
          pageName="Invoice Details" 
          items={[
            { label: "Home", href: "/" },
            { label: "Invoices", href: "/invoices" },
            { label: "Invoice Details" }
          ]}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb 
          pageName="Invoice Details" 
          items={[
            { label: "Home", href: "/" },
            { label: "Invoices", href: "/invoices" },
            { label: "Invoice Details" }
          ]}
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error === 'Invoice not found' ? 'Invoice Not Found' : 'Error Loading Invoice'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => router.push('/invoices')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb 
        pageName={`Invoice #${invoice.id}`} 
        items={[
          { label: "Home", href: "/" },
          { label: "Invoices", href: "/invoices" },
          { label: `Invoice #${invoice.id}` }
        ]}
      />
      
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Payment Completed Successfully
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                Your payment has been processed. The invoice will be updated once the payment is confirmed via webhook.
              </p>
            </div>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Invoice #{invoice.id}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Created on {formatDate(invoice.createdAt)}
            </p>
          </div>
          {/* Workflow Status Badge */}
          {invoice.workflowStatus && (
            <WorkflowStatusBadge status={invoice.workflowStatus} />
          )}
          {/* Outstanding Balance Badge */}
          {invoice.workflowStatus && getRemainingBalance() > 0 && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-2">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                Outstanding Balance
              </p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                KES {(getRemainingBalance() / 100).toLocaleString('en-KE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/invoices')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to List
          </button>
          <button
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Invoice
          </button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Client Name</label>
                <p className="text-gray-900 dark:text-white font-medium">{invoice.clientName}</p>
              </div>
              {invoice.clientEmail && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{invoice.clientEmail}</p>
                </div>
              )}
              {invoice.clientAddress && (
                <div className={`${!invoice.clientEmail ? 'md:col-span-2' : 'lg:col-span-1 md:col-span-2'}`}>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                  <p className="text-gray-900 dark:text-white text-sm">{invoice.clientAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Invoice Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">S.No.#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Products</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Discount</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {invoice.items?.length ? (
                    <>
                      {invoice.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatAmountFromCents(item.rate)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                            {item.discount ? `-${formatAmountFromCents(item.discount)}` : formatAmountFromCents(0)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                            {formatAmountFromCents(item.amount - (item.discount || 0))}
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white" colSpan={4}>
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-white">
                          -{formatAmountFromCents(invoice.items.reduce((total, item) => total + (item.discount || 0), 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-white">
                          {formatAmountFromCents(invoice.items.reduce((total, item) => total + (item.amount - (item.discount || 0)), 0))}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No items found for this invoice
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notes
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Workflow Management - Compact Grid Layout */}
          {invoice.deliveryInfo && (
            <div className="grid grid-cols-1 gap-4">
              {/* Delivery Status */}
              <DeliveryStatusToggle
                deliveryInfo={invoice.deliveryInfo}
                onUpdate={handleDeliveryUpdate}
              />
            </div>
          )}

          {/* Payment History - Full Width */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-4">
              <PaymentHistory payments={invoice.payments} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Invoice Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</span>
                <span className="text-sm text-gray-900 dark:text-white">{invoice.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Issue Date</span>
                <span className="text-sm text-gray-900 dark:text-white">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</span>
                <span className="text-sm text-gray-900 dark:text-white">{formatDate(invoice.dueDate)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-600" />
              {invoice.subtotal && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatAmountFromCents(invoice.subtotal)}
                  </span>
                </div>
              )}
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Discount</span>
                  <span className="text-sm text-red-600 dark:text-red-400">
                    -{formatAmountFromCents(invoice.discountAmount)}
                  </span>
                </div>
              )}
              {invoice.taxAmount && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatAmountFromCents(invoice.taxAmount)}
                  </span>
                </div>
              )}
              <hr className="border-gray-200 dark:border-gray-600" />
              <div className="flex justify-between">
                <span className="text-base font-medium text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatAmountFromCents(invoice.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {/* Make Payment - Only show if there's remaining balance */}
              {invoice.workflowStatus && getRemainingBalance() > 0 && (
                <button
                  onClick={openPaymentModal}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Make Payment
                </button>
              )}
              
              {/* Print Invoice */}
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                Print
              </button>
              
              <button
                onClick={() => {/* TODO: Download PDF */}}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => {/* TODO: Send Invoice */}}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Send Invoice
              </button>
              <button
                onClick={() => {/* TODO: Duplicate Invoice */}}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Duplicate Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {invoice && invoice.workflowStatus && getRemainingBalance() > 0 && (
        <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} className="max-w-[600px] m-4">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Record Payment
              </h2>
              <span className="text-gray-400 dark:text-gray-600">—</span>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  Balance: KES {(getRemainingBalance() / 100).toLocaleString('en-KE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <PaymentRecordingForm
              invoiceId={invoice.id}
              remainingBalance={getRemainingBalance()}
              customerPhone={invoice.clientPhone}
              customerEmail={invoice.clientEmail}
              onPaymentRecorded={handlePaymentRecorded}
              onClose={closePaymentModal}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}