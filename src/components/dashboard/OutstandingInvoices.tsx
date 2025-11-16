"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import { InvoiceService } from "@/lib/services/invoices/invoiceService";
import { Invoice, WorkflowStatus } from "@/lib/services/invoices/types";

interface OutstandingStats {
  total: number;
  totalAmount: number;
  overdue: number;
  overdueAmount: number;
  dueThisWeek: number;
  dueThisWeekAmount: number;
  invoices: Invoice[];
}

export default function OutstandingInvoices() {
  const router = useRouter();
  const [stats, setStats] = useState<OutstandingStats>({
    total: 0,
    totalAmount: 0,
    overdue: 0,
    overdueAmount: 0,
    dueThisWeek: 0,
    dueThisWeekAmount: 0,
    invoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOutstandingInvoices();
  }, []);

  const loadOutstandingInvoices = async () => {
    setLoading(true);
    try {
      const response = await InvoiceService.getAllInvoices();
      if (response.success && response.data) {
        const now = new Date();
        const oneWeekFromNow = new Date(now);
        oneWeekFromNow.setDate(now.getDate() + 7);

        // Filter outstanding invoices (sent or partially paid)
        const outstandingInvoices = response.data.filter(
          (inv: Invoice) =>
            inv.workflowStatus === WorkflowStatus.SENT ||
            inv.workflowStatus === WorkflowStatus.PARTIALLY_PAID
        );

        // Calculate overdue invoices
        const overdueInvoices = outstandingInvoices.filter((inv: Invoice) => {
          if (!inv.paymentDueDate) return false;
          const dueDate = inv.paymentDueDate instanceof Date 
            ? inv.paymentDueDate 
            : new Date(inv.paymentDueDate);
          return dueDate < now;
        });

        // Calculate invoices due this week
        const dueThisWeekInvoices = outstandingInvoices.filter((inv: Invoice) => {
          if (!inv.paymentDueDate) return false;
          const dueDate = inv.paymentDueDate instanceof Date 
            ? inv.paymentDueDate 
            : new Date(inv.paymentDueDate);
          return dueDate >= now && dueDate <= oneWeekFromNow;
        });

        // Calculate amounts
        const totalAmount = outstandingInvoices.reduce((sum: number, inv: Invoice) => {
          const paidAmount = inv.payments?.reduce((s: number, p) => s + p.amount, 0) || 0;
          return sum + (inv.amount - paidAmount);
        }, 0);

        const overdueAmount = overdueInvoices.reduce((sum: number, inv: Invoice) => {
          const paidAmount = inv.payments?.reduce((s: number, p) => s + p.amount, 0) || 0;
          return sum + (inv.amount - paidAmount);
        }, 0);

        const dueThisWeekAmount = dueThisWeekInvoices.reduce((sum: number, inv: Invoice) => {
          const paidAmount = inv.payments?.reduce((s: number, p) => s + p.amount, 0) || 0;
          return sum + (inv.amount - paidAmount);
        }, 0);

        // Sort by due date (overdue first)
        const sortedInvoices = [...outstandingInvoices].sort((a, b) => {
          if (!a.paymentDueDate) return 1;
          if (!b.paymentDueDate) return -1;
          const dateA = a.paymentDueDate instanceof Date ? a.paymentDueDate : new Date(a.paymentDueDate);
          const dateB = b.paymentDueDate instanceof Date ? b.paymentDueDate : new Date(b.paymentDueDate);
          return dateA.getTime() - dateB.getTime();
        }).slice(0, 5); // Show top 5

        setStats({
          total: outstandingInvoices.length,
          totalAmount,
          overdue: overdueInvoices.length,
          overdueAmount,
          dueThisWeek: dueThisWeekInvoices.length,
          dueThisWeekAmount,
          invoices: sortedInvoices,
        });
      }
    } catch (error) {
      console.error('Error loading outstanding invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No due date';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: Date | string | undefined) => {
    if (!dueDate) return false;
    const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
    return date < new Date();
  };

  const getOutstandingAmount = (invoice: Invoice) => {
    const paidAmount = invoice.payments?.reduce((sum: number, p) => sum + p.amount, 0) || 0;
    return invoice.amount - paidAmount;
  };

  return (
    <ComponentCard
      title="Outstanding Invoices"
      className="h-full"
      action={
        <button
          onClick={() => router.push('/invoices')}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View All
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Outstanding</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overdue</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(stats.overdueAmount)}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Due This Week</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.dueThisWeek}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(stats.dueThisWeekAmount)}
              </p>
            </div>
          </div>

          {/* Invoice List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Recent Outstanding
            </h4>
            {stats.invoices.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No outstanding invoices
              </p>
            ) : (
              <div className="space-y-2">
                {stats.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          #{invoice.id}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {invoice.clientName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(getOutstandingAmount(invoice))}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded ${
                            invoice.workflowStatus === WorkflowStatus.PARTIALLY_PAID
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}
                        >
                          {invoice.workflowStatus === WorkflowStatus.PARTIALLY_PAID
                            ? 'Partially Paid'
                            : 'Sent'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Due: {formatDate(invoice.paymentDueDate)}
                      </span>
                      {isOverdue(invoice.paymentDueDate) && (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ComponentCard>
  );
}
