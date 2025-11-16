import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import TopSellingProducts from "@/components/ecommerce/TopSellingProducts";
import WorkflowOverview from "@/components/dashboard/WorkflowOverview";
import RevenueBreakdown from "@/components/dashboard/RevenueBreakdown";
import OutstandingInvoices from "@/components/dashboard/OutstandingInvoices";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />

        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      {/* Phase 4: Workflow Overview - Order → Invoice → Payment → Delivery Pipeline */}
      <div className="col-span-12">
        <WorkflowOverview />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      {/* Phase 4: Revenue Breakdown by Payment Method */}
      <div className="col-span-12 xl:col-span-6">
        <RevenueBreakdown />
      </div>

      {/* Phase 4: Outstanding Invoices with Overdue Tracking */}
      <div className="col-span-12 xl:col-span-6">
        <OutstandingInvoices />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <TopSellingProducts />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <RecentOrders />
      </div>
    </div>
  );
}
