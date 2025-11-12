'use client';

import React, { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
import { ScanResult } from '../../lib/services/barcode/barcodeService';

interface QuickScanWidgetProps {
  onProductFound?: (product: ScanResult['product']) => void;
  onProductNotFound?: (barcode: string) => void;
  className?: string;
}

const QuickScanWidget: React.FC<QuickScanWidgetProps> = ({
  onProductFound,
  onProductNotFound,
  className = ''
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScanSuccess = async (result: ScanResult) => {
    setIsLoading(true);
    setLastScanResult(result);

    if (result.success && result.product) {
      onProductFound?.(result.product);
    } else {
      onProductNotFound?.(result.error || 'Unknown error');
    }

    // Auto-close scanner after successful scan
    setTimeout(() => {
      setShowScanner(false);
      setIsLoading(false);
    }, 1500);
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
    onProductNotFound?.(error);
  };

  return (
    <>
      {/* Quick Scan Button */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Scan
          </h3>
          <div className="text-2xl">📱</div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Scan product barcodes for quick inventory lookup and stock movements
        </p>

        <button
          onClick={() => setShowScanner(true)}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Start Scanning
            </>
          )}
        </button>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Last Scan Result:
            </div>
            {lastScanResult.success && lastScanResult.product ? (
              <div className="text-sm text-green-600 dark:text-green-400">
                ✅ Found: {lastScanResult.product.name} ({lastScanResult.product.sku})
              </div>
            ) : (
              <div className="text-sm text-red-600 dark:text-red-400">
                ❌ {lastScanResult.error || 'Product not found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </>
  );
};

export default QuickScanWidget;