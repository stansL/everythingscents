import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Manage Promotions | TailAdmin - Next.js Dashboard Template",
  description: "This is Manage Promotions page for TailAdmin Tailwind CSS Admin Dashboard Template",
};

export default function ManagePromotionsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Manage Promotions" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Promotions Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Manage promotional campaigns here. This page will be developed to include
            discount codes, promotional campaigns, seasonal offers, and marketing analytics.
          </p>
        </div>
      </div>
    </div>
  );
}