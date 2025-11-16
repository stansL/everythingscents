"use client";
import { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import { OrderService } from "@/lib/services/orders/orderService";
import { InvoiceService } from "@/lib/services/invoices/invoiceService";
import { transactionService } from "@/lib/services/transactions/transactionService";
import { OrderStatus } from "@/lib/services/orders/types";
import { WorkflowStatus } from "@/lib/services/invoices/types";
import { TransactionStatus } from "@/lib/services/transactions/types";

interface WorkflowStats {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    partiallyPaid: number;
    paid: number;
  };
  transactions: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
  };
  deliveries: {
    total: number;
    pending: number;
    outForDelivery: number;
    completed: number;
  };
}

export default function WorkflowOverview() {
  const [stats, setStats] = useState<WorkflowStats>({
    orders: { total: 0, pending: 0, confirmed: 0, processing: 0 },
    invoices: { total: 0, draft: 0, sent: 0, partiallyPaid: 0, paid: 0 },
    transactions: { total: 0, pending: 0, completed: 0, failed: 0 },
    deliveries: { total: 0, pending: 0, outForDelivery: 0, completed: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflowStats();
  }, []);

  const loadWorkflowStats = async () => {
    setLoading(true);
    try {
      // Load orders
      const ordersResponse = await OrderService.getAllOrders();
      const orders = ordersResponse.data || [];
      
      // Load invoices
      const invoicesResponse = await InvoiceService.getAllInvoices();
      const invoices = invoicesResponse.data || [];
      
      // Load transactions
      const transactions = await transactionService.getTransactions();
      
      console.log('Workflow Stats Data:', {
        ordersCount: orders.length,
        invoicesCount: invoices.length,
        transactionsCount: transactions.length,
      });

      // Calculate order stats
      const orderStats = {
        total: orders.length,
        pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
        confirmed: orders.filter(o => o.status === OrderStatus.CONFIRMED).length,
        processing: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
      };

      // Calculate invoice stats
      const invoiceStats = {
        total: invoices.length,
        draft: invoices.filter(i => i.workflowStatus === WorkflowStatus.DRAFT).length,
        sent: invoices.filter(i => i.workflowStatus === WorkflowStatus.SENT).length,
        partiallyPaid: invoices.filter(i => i.workflowStatus === WorkflowStatus.PARTIALLY_PAID).length,
        paid: invoices.filter(i => i.workflowStatus === WorkflowStatus.PAID).length,
      };

      // Calculate transaction stats
      const transactionStats = {
        total: transactions.length,
        pending: transactions.filter(t => t.status === TransactionStatus.PENDING).length,
        completed: transactions.filter(t => t.status === TransactionStatus.COMPLETED).length,
        failed: transactions.filter(t => t.status === TransactionStatus.FAILED).length,
      };

      // Calculate delivery stats (from invoices)
      const deliveryStats = {
        total: invoices.filter(i => i.deliveryInfo).length,
        pending: invoices.filter(i => i.deliveryInfo?.status === 'pending').length,
        outForDelivery: invoices.filter(i => i.deliveryInfo?.status === 'out_for_delivery').length,
        completed: invoices.filter(i => i.deliveryInfo?.status === 'completed').length,
      };

      setStats({
        orders: orderStats,
        invoices: invoiceStats,
        transactions: transactionStats,
        deliveries: deliveryStats,
      });
    } catch (error) {
      console.error("Error loading workflow stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const PipelineStage = ({ 
    title, 
    total, 
    items, 
    icon 
  }: { 
    title: string; 
    total: number; 
    items: { label: string; count: number; color: string }[];
    icon: React.ReactNode;
  }) => (
    <div className="flex-1 min-w-[200px]">
      <div className="rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 className="text-sm font-semibold text-black dark:text-white">
            {title}
          </h4>
        </div>
        
        <div className="mb-3">
          <p className="text-3xl font-bold text-black dark:text-white">
            {total}
          </p>
          <p className="text-xs text-bodydark">Total {title.toLowerCase()}</p>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs text-bodydark">{item.label}</span>
              <span className={`text-xs font-semibold ${item.color}`}>
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ComponentCard title="Workflow Pipeline Overview">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
        {/* Pipeline Visualization */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <PipelineStage
            title="Orders"
            total={stats.orders.total}
            items={[
              { label: "Pending", count: stats.orders.pending, color: "text-yellow-600" },
              { label: "Confirmed", count: stats.orders.confirmed, color: "text-blue-600" },
              { label: "Processing", count: stats.orders.processing, color: "text-purple-600" },
            ]}
            icon={
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />

          <div className="flex items-center text-gray-400 dark:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <PipelineStage
            title="Invoices"
            total={stats.invoices.total}
            items={[
              { label: "Draft", count: stats.invoices.draft, color: "text-gray-600" },
              { label: "Sent", count: stats.invoices.sent, color: "text-blue-600" },
              { label: "Partially Paid", count: stats.invoices.partiallyPaid, color: "text-yellow-600" },
              { label: "Paid", count: stats.invoices.paid, color: "text-green-600" },
            ]}
            icon={
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <div className="flex items-center text-gray-400 dark:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <PipelineStage
            title="Payments"
            total={stats.transactions.total}
            items={[
              { label: "Pending", count: stats.transactions.pending, color: "text-yellow-600" },
              { label: "Completed", count: stats.transactions.completed, color: "text-green-600" },
              { label: "Failed", count: stats.transactions.failed, color: "text-red-600" },
            ]}
            icon={
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />

          <div className="flex items-center text-gray-400 dark:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <PipelineStage
            title="Deliveries"
            total={stats.deliveries.total}
            items={[
              { label: "Pending", count: stats.deliveries.pending, color: "text-yellow-600" },
              { label: "Out for Delivery", count: stats.deliveries.outForDelivery, color: "text-blue-600" },
              { label: "Completed", count: stats.deliveries.completed, color: "text-green-600" },
            ]}
            icon={
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="border-t border-stroke pt-4 dark:border-strokedark">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadWorkflowStats}
              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-opacity-90"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        </div>
      )}
    </ComponentCard>
  );
}
