import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Manage Orders | TailAdmin - Next.js Dashboard Template",
  description: "This is Manage Orders page for TailAdmin Tailwind CSS Admin Dashboard Template",
};

export default function ManageOrdersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Manage Orders" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Order Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Manage customer orders here. This page will be developed to include
            order tracking, status updates, fulfillment, and order history features.
          </p>
        </div>
      </div>
    </div>
  );
}