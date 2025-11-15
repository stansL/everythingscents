"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { GridIcon, BoxIcon, CheckCircleIcon } from "@/icons/index";

const OrdersPage = () => {
  const breadcrumbItems = [
    { label: "Order Management", href: "/" },
    { label: "Orders", href: "/orders", isCurrentPage: true },
  ];

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
                  0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coming soon
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
                  0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coming soon
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
                  0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coming soon
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
                  0%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coming soon
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-1">
          <ComponentCard 
            title="Order Management System"
            desc="This page will contain the order management interface for PWA integration and staff-assisted ordering as outlined in the Order-to-Delivery workflow plan."
          >
            <div className="p-6">
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                <div className="mx-auto max-w-md">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Coming Soon</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    The order management system will include:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
                    <li>• Monitor and review PWA customer orders</li>
                    <li>• Create orders for walk-in customers</li>
                    <li>• Quick order templates for repeat customers</li>
                    <li>• Convert confirmed orders to invoices</li>
                    <li>• Order status tracking and updates</li>
                    <li>• Distinguish between PWA vs admin-created orders</li>
                  </ul>
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default OrdersPage;