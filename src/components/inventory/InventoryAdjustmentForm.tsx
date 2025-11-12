import React, { useState } from 'react';
import { InventoryService } from '@/lib/services/inventory/inventoryService';
import { ProductService } from '@/lib/services/products';
import { 
  InventoryTransaction, 
  Product,
  InventoryAdjustmentInput 
} from '@/lib/services/products/types';

interface InventoryAdjustmentFormProps {
  productId?: string;
  onSuccess?: (transaction: InventoryTransaction) => void;
  onCancel?: () => void;
}

export const InventoryAdjustmentForm: React.FC<InventoryAdjustmentFormProps> = ({
  productId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const showProductSelection = !productId;

  const [formData, setFormData] = useState<InventoryAdjustmentInput>({
    productId: productId || '',
    adjustmentType: 'correction',
    quantity: 0,
    reason: 'stock_count',
    notes: ''
  });

  React.useEffect(() => {
    if (!productId) {
      loadProducts();
    } else {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProducts = async () => {
    try {
      const response = await ProductService.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadProduct = async (id: string) => {
    try {
      const response = await ProductService.getProductById(id);
      if (response.success && response.data) {
        setSelectedProduct(response.data);
        setFormData((prev: InventoryAdjustmentInput) => ({ 
          ...prev, 
          productId: id,
          quantity: response.data!.totalUnits || response.data!.stock || 0
        }));
      }
    } catch (err) {
      console.error('Error loading product:', err);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData((prev: InventoryAdjustmentInput) => ({ 
      ...prev, 
      productId,
      quantity: product ? (product.totalUnits || product.stock || 0) : 0
    }));
  };

  const handleAdjustmentTypeChange = (type: 'increase' | 'decrease' | 'correction') => {
    setFormData((prev: InventoryAdjustmentInput) => ({
      ...prev,
      adjustmentType: type,
      quantity: 0
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: InventoryAdjustmentInput) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unitCost' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (formData.quantity === 0) {
      setError('Please enter a quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await InventoryService.adjustInventory(formData);
      
      if (response.success && response.transaction) {
        onSuccess?.(response.transaction);
        
        // Reset form
        setFormData({
          productId: productId || '',
          adjustmentType: 'correction',
          quantity: 0,
          reason: 'stock_count',
          notes: ''
        });
        
        // Reload product data
        if (selectedProduct?.id) {
          loadProduct(selectedProduct.id);
        }
      } else {
        setError(response.error || 'Failed to adjust inventory');
      }
    } catch (err) {
      setError('An error occurred while adjusting inventory');
      console.error('Error adjusting inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const adjustmentTypeOptions = [
    { value: 'correction', label: 'Stock Correction', description: 'Correct inventory based on physical count' },
    { value: 'increase', label: 'Increase Stock', description: 'Add additional units to inventory' },
    { value: 'decrease', label: 'Decrease Stock', description: 'Remove units from inventory' }
  ];

  const reasonOptions = [
    { value: 'stock_count', label: 'Stock Count' },
    { value: 'damage', label: 'Damage/Loss' },
    { value: 'expired', label: 'Expired Product' },
    { value: 'found', label: 'Found Inventory' },
    { value: 'theft', label: 'Theft/Shrinkage' },
    { value: 'return', label: 'Customer Return' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Inventory Adjustment
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Selection */}
        {showProductSelection && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.sku} (Current: {product.totalUnits || product.stock || 0} units)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Product Info */}
        {selectedProduct && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current Inventory Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Product:</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.name}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.sku}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Current Stock:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedProduct.totalUnits || selectedProduct.stock || 0} units
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Adjustment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Adjustment Method *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adjustmentTypeOptions.map((option) => (
              <div
                key={option.value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.adjustmentType === option.value
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => handleAdjustmentTypeChange(option.value as 'increase' | 'decrease' | 'correction')}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="adjustmentType"
                    value={option.value}
                    checked={formData.adjustmentType === option.value}
                    onChange={() => handleAdjustmentTypeChange(option.value as 'increase' | 'decrease' | 'correction')}
                    className="mt-1 w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adjustment Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleInputChange}
              min="0"
              step="1"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter quantity"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.adjustmentType === 'correction' ? 'Enter the correct total quantity' : 
               formData.adjustmentType === 'increase' ? 'Enter quantity to add' : 'Enter quantity to remove'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Stock
            </label>
            <div className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
              {selectedProduct ? (selectedProduct.totalUnits || selectedProduct.stock || 0) : 0} units
            </div>
          </div>
        </div>

        {/* Adjustment Preview */}
        {formData.quantity > 0 && (
          <div className={`p-4 rounded-lg border ${
            formData.adjustmentType === 'increase' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : formData.adjustmentType === 'decrease'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {formData.adjustmentType === 'increase' ? (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              ) : formData.adjustmentType === 'decrease' ? (
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className={`font-medium ${
                formData.adjustmentType === 'increase' 
                  ? 'text-green-900 dark:text-green-100' 
                  : formData.adjustmentType === 'decrease'
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {formData.adjustmentType === 'correction' ? `Set to ${formData.quantity}` : 
                 `${formData.adjustmentType} by ${formData.quantity}`} units
              </span>
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for Adjustment *
          </label>
          <select
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            {reasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-y"
            placeholder="Additional details about this adjustment..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !selectedProduct || formData.quantity === 0}
            className="flex-1 sm:flex-none px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Adjustment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};