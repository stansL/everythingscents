"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { GridIcon, BoxIcon, CheckCircleIcon } from "@/icons/index";
import { OrderDataTable, OrderToInvoiceConverter, QuickOrderModal } from "@/components/orders";
import { Order, OrderSource } from "@/lib/services/orders/types";
import { OrderService } from "@/lib/services/orders/orderService";
import { Invoice } from "@/lib/services/invoices/types";

const OrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConverter, setShowConverter] = useState(false);
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  
  // Summary stats
  const [stats, setStats] = useState({
    total: 0,
    pwaOrders: 0,
    walkInOrders: 0,
    conversionRate: 0,
  });

  const breadcrumbItems = [
    { label: "Order Management", href: "/" },
    { label: "Orders", href: "/orders", isCurrentPage: true },
  ];

  // Load orders
  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await OrderService.getAllOrders();
      if (response.success && response.data) {
        setOrders(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const pwaOrders = response.data.filter(o => o.source === OrderSource.PWA).length;
        const walkInOrders = response.data.filter(o => o.source === OrderSource.WALK_IN).length;
        const converted = response.data.filter(o => o.invoiceId).length;
        const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
        
        setStats({
          total,
          pwaOrders,
          walkInOrders,
          conversionRate,
        });
      } else {
        setError(response.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Handle order creation
  const handleOrderCreated = (order: Order) => {
    setShowQuickOrderModal(false);
    loadOrders(); // Refresh the list
  };

  // Handle order conversion
  const handleConvertOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowConverter(true);
  };

  const handleConversionSuccess = (invoice: Invoice) => {
    setShowConverter(false);
    setSelectedOrder(null);
    loadOrders(); // Refresh to show updated conversion status
    // Navigate to invoice details
    router.push(`/invoices/${invoice.id}`);
  };

  const handleConversionCancel = () => {
    setShowConverter(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <PageBreadCrumb 
        pageTitle="Order Management"
        items={breadcrumbItems}
        description="Monitor and manage customer orders from PWA and walk-in customers"
      />
      
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        {/* Order Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.total}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  All order sources
                </p>
              </div>
              <GridIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  PWA Orders
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.pwaOrders}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customer self-service
                </p>
              </div>
              <BoxIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Walk-in Orders
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats.walkInOrders}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Staff-assisted
                </p>
              </div>
              <GridIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : `${stats.conversionRate}%`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Orders → Invoices
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Quick Order Modal */}
        <QuickOrderModal
          isOpen={showQuickOrderModal}
          onClose={() => setShowQuickOrderModal(false)}
          onSuccess={handleOrderCreated}
        />

        {/* Order Converter Modal */}
        {showConverter && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Convert Order to Invoice
                </h2>
                <button
                  onClick={handleConversionCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <OrderToInvoiceConverter
                order={selectedOrder}
                onSuccess={handleConversionSuccess}
                onCancel={handleConversionCancel}
              />
            </div>
          </div>
        )}

        {/* Orders Table */}
        {!showConverter && (
          <div className="grid gap-4 md:grid-cols-1">
            <ComponentCard 
              title="All Orders"
              desc="View and manage all orders from PWA customers and staff-created entries"
              action={
                <button
                  onClick={() => setShowQuickOrderModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Quick Order Entry
                </button>
              }
            >
              <div className="p-6">
                <OrderDataTable
                  orders={orders}
                  loading={loading}
                  onConvert={handleConvertOrder}
                />
              </div>
            </ComponentCard>
          </div>
        )}
      </div>
    </>
  );
};

export default OrdersPage;