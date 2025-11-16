import React from 'react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import SalesReport from '@/components/reports/SalesReport';
import PaymentMethodReport from '@/components/reports/PaymentMethodReport';
import OutstandingInvoicesReport from '@/components/reports/OutstandingInvoicesReport';
import DeliveryPerformanceReport from '@/components/reports/DeliveryPerformanceReport';

export const metadata = {
  title: 'Business Reporting | Everything Scents',
  description: 'Comprehensive business reports including sales, payments, outstanding invoices, and delivery performance',
};

export default function ReportingPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageBreadCrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Reporting', href: '/reporting' },
        ]}
      />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Business Reporting
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Comprehensive insights into sales, payments, outstanding invoices, and delivery performance
        </p>
      </div>

      {/* Reports Grid - Phase 6 components will be added here */}
      <div className="grid grid-cols-1 gap-6">
        {/* Task 6.1: Sales Report ✅ */}
        <SalesReport />

        {/* Task 6.2: Payment Method Report ✅ */}
        <PaymentMethodReport />

        {/* Task 6.3: Outstanding Invoices Report ✅ */}
        <OutstandingInvoicesReport />

        {/* Task 6.4: Delivery Performance Report ✅ */}
        <DeliveryPerformanceReport />
      </div>
    </div>
  );
}
