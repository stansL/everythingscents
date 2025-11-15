"use client";
import React, { useState } from "react";
import { Invoice } from "@/lib/services/invoices/types";
import { InvoiceService } from "@/lib/services/invoices/invoiceService";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface InvoiceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onInvoiceUpdate: () => void;
}

const InvoiceDeleteModal: React.FC<InvoiceDeleteModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onInvoiceUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== invoice.id) {
      setError("Please type the invoice ID exactly to confirm deletion");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await InvoiceService.deleteInvoice(invoice.id);
      
      if (response.success) {
        onInvoiceUpdate();
        onClose();
      } else {
        setError(response.error || "Failed to delete invoice");
      }
    } catch {
      setError("An error occurred while deleting the invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[500px] m-4">
      <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-14">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Delete Invoice
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="px-2 pb-3">
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete Invoice <span className="font-medium text-gray-900 dark:text-white">#{invoice.id}</span>? 
              This will permanently remove the invoice and cannot be undone.
            </p>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                Invoice #{invoice.id}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Client: {invoice.clientName}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Status: {invoice.status}</span>
                <span>Amount: ${(invoice.amount / 100).toFixed(2)}</span>
                <span>Category: {invoice.category}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Type <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  {invoice.id}
                </span> to confirm deletion:
              </p>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter invoice ID to confirm"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleDelete}
            disabled={loading || confirmText !== invoice.id}
            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
          >
            {loading ? "Deleting..." : "Delete Invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDeleteModal;