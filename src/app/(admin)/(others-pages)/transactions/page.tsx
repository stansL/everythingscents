"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { GridIcon, BoxIcon, ArrowUpIcon } from "@/icons/index";

const TransactionsPage = () => {
  const breadcrumbItems = [
    { label: "Order Management", href: "/" },
    { label: "Transactions", href: "/transactions", isCurrentPage: true },
  ];

  return (
    <>
      <PageBreadCrumb 
        pageTitle="Transaction Management"
        items={breadcrumbItems}
        description="Monitor and reconcile all payment transactions"
      />
      
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        {/* Transaction Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  KES 0.00
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
                  M-Pesa Transactions
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
                  Cash Transactions
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
                  Reconciliation Status
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  0%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coming soon
                </p>
              </div>
              <ArrowUpIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-1">
          <ComponentCard 
            title="Transaction Management"
            desc="This page will contain the transaction reconciliation dashboard, M-Pesa integration, and payment method analytics as outlined in the Order-to-Delivery workflow plan."
          >
            <div className="p-6">
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                <div className="mx-auto max-w-md">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Coming Soon</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    The transaction management system will include:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
                    <li>• Payment reconciliation dashboard</li>
                    <li>• M-Pesa transaction matching and validation</li>
                    <li>• Daily payment summaries by method</li>
                    <li>• Failed payment tracking and retry mechanisms</li>
                    <li>• Payment method performance analytics</li>
                    <li>• Outstanding balance reports</li>
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

export default TransactionsPage;