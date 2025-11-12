'use client';

import React, { useState, useEffect } from 'react';
import BarcodeScanner from './BarcodeScanner';
import { ScanResult } from '../../lib/services/barcode/barcodeService';
import { InventoryService } from '../../lib/services/inventory/inventoryService';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  unitCost: number;
  sellingPrice: number;
}

interface Transaction {
  productId: string;
  type: MovementType;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  reason: string;
  date: Date;
  metadata?: {
    scannedBarcode?: string;
    quickMovement?: boolean;
  };
}

interface QuickStockMovementProps {
  onTransactionComplete?: (transaction: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
}

type MovementType = 'sale' | 'adjustment' | 'transfer' | 'purchase';

const QuickStockMovement: React.FC<QuickStockMovementProps> = ({
  onTransactionComplete,
  isOpen,
  onClose
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('sale');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setScannedProduct(null);
      setQuantity(1);
      setUnitPrice(0);
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  // Update unit price when product changes
  useEffect(() => {
    if (scannedProduct) {
      if (movementType === 'sale') {
        setUnitPrice(scannedProduct.sellingPrice);
      } else if (movementType === 'purchase') {
        setUnitPrice(scannedProduct.unitCost);
      } else {
        setUnitPrice(scannedProduct.unitCost);
      }
    }
  }, [scannedProduct, movementType]);

  const handleScanSuccess = (result: ScanResult) => {
    if (result.success && result.product) {
      setScannedProduct(result.product);
      setShowScanner(false);
      setError(null);
    } else {
      setError(result.error || 'Product not found');
    }
  };

  const handleScanError = (error: string) => {
    setError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scannedProduct) {
      setError('Please scan a product first');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (movementType === 'sale' && quantity > scannedProduct.currentStock) {
      setError('Insufficient stock for sale');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const transaction = {
        productId: scannedProduct.id,
        type: movementType,
        quantity: movementType === 'sale' ? -quantity : quantity,
        unitPrice: unitPrice,
        totalValue: quantity * unitPrice,
        reason: reason || `Quick ${movementType} via barcode scan`,
        date: new Date(),
        metadata: {
          scannedBarcode: scannedProduct.barcode,
          quickMovement: true
        }
      };

      await InventoryService.addTransaction(transaction);
      onTransactionComplete?.(transaction);
      
      // Reset form for next transaction
      setScannedProduct(null);
      setQuantity(1);
      setUnitPrice(0);
      setReason('');
      
      // Show success message briefly
      setError('✅ Transaction completed successfully!');
      setTimeout(() => {
        setError(null);
      }, 2000);

    } catch (error) {
      console.error('Transaction error:', error);
      setError('Failed to process transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const getMovementColor = (type: MovementType) => {
    switch (type) {
      case 'sale': return 'text-red-600 dark:text-red-400';
      case 'purchase': return 'text-green-600 dark:text-green-400';
      case 'adjustment': return 'text-blue-600 dark:text-blue-400';
      case 'transfer': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Stock Movement
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scan and process stock movements quickly
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg ${
              error.startsWith('✅') 
                ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
            }`}>
              <p className={`text-sm ${
                error.startsWith('✅')
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Product Scan Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product
              </label>
              {!scannedProduct ? (
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <div>Tap to scan product barcode</div>
                  </div>
                </button>
              ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {scannedProduct.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {scannedProduct.sku} | Stock: {scannedProduct.currentStock}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
                    >
                      Rescan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {scannedProduct && (
              <>
                {/* Movement Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Movement Type
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as MovementType)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="sale">Sale (Outbound)</option>
                    <option value="purchase">Purchase (Inbound)</option>
                    <option value="adjustment">Stock Adjustment</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                    max={movementType === 'sale' ? scannedProduct.currentStock : undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                  {movementType === 'sale' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Available stock: {scannedProduct.currentStock}
                    </p>
                  )}
                </div>

                {/* Unit Price */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Reason/Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason/Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Quick ${movementType} via barcode scan`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Transaction Summary */}
                <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Transaction Summary
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className={`font-medium ${getMovementColor(movementType)}`}>
                        {movementType.charAt(0).toUpperCase() + movementType.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="text-gray-900 dark:text-white">
                        {movementType === 'sale' ? '-' : '+'}{quantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                      <span className="text-gray-900 dark:text-white">
                        ${(quantity * unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing || !scannedProduct}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    `Process ${movementType.charAt(0).toUpperCase() + movementType.slice(1)}`
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </>
  );
};

export default QuickStockMovement;