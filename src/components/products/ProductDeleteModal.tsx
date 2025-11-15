"use client";
import React, { useState } from "react";
import { Product, ProductService } from "@/lib";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface ProductDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onProductUpdate: () => void;
}

const ProductDeleteModal: React.FC<ProductDeleteModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== product.name) {
      setError("Please type the product name exactly to confirm deletion");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await ProductService.deleteProduct(product.id!);
      
      if (response.success) {
        onProductUpdate();
        onClose();
      } else {
        setError(response.error || "Failed to delete product");
      }
    } catch {
      setError("An error occurred while deleting the product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
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
                Delete Product
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
              Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>? 
              This will permanently remove the product from your inventory and cannot be undone.
            </p>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                {product.name}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                SKU: {product.sku}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Brand: {product.brand}</span>
                <span>Stock: {product.stock}</span>
                <span>Price: ${product.price.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Type <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  {product.name}
                </span> to confirm deletion:
              </p>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter product name to confirm"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleDelete}
            disabled={loading || confirmText !== product.name}
            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
          >
            {loading ? "Deleting..." : "Delete Product"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDeleteModal;