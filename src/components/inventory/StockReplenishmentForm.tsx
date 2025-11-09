import React, { useState, useEffect } from 'react';
import { InventoryService } from '@/lib/services/inventory/inventoryService';
import { ProductService } from '@/lib/services/products';
import { 
  InventoryTransaction, 
  Product, 
  InventoryReplenishmentInput 
} from '@/lib/services/products/types';

interface StockReplenishmentFormProps {
  productId?: string;
  onSuccess?: (transaction: InventoryTransaction) => void;
  onCancel?: () => void;
}

export const StockReplenishmentForm: React.FC<StockReplenishmentFormProps> = ({
  productId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wacPreview, setWacPreview] = useState<{
    currentWAC: number;
    newWAC: number;
    totalValue: number;
    newTotalUnits: number;
  } | null>(null);

  const [formData, setFormData] = useState<InventoryReplenishmentInput>({
    productId: productId || '',
    quantity: 0,
    unitCost: 0,
    supplierId: undefined,
    invoiceReference: '',
    notes: ''
  });

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Load specific product if productId provided
  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProducts = async () => {
    try {
      const response = await ProductService.getAllProducts();
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
        setFormData(prev => ({ ...prev, productId: id }));
      }
    } catch (err) {
      console.error('Error loading product:', err);
    }
  };

  const calculateWACPreview = React.useCallback(() => {
    if (!selectedProduct || formData.quantity <= 0 || formData.unitCost <= 0) {
      setWacPreview(null);
      return;
    }

    const currentStock = selectedProduct.totalUnits || selectedProduct.stock || 0;
    const currentWAC = selectedProduct.weightedAverageCost || selectedProduct.costPrice || 0;

    // Calculate new WAC
    const currentTotalValue = currentStock * currentWAC;
    const newInventoryValue = formData.quantity * formData.unitCost;
    const newTotalUnits = currentStock + formData.quantity;
    const newTotalValue = currentTotalValue + newInventoryValue;
    const newWAC = newTotalUnits > 0 ? newTotalValue / newTotalUnits : 0;

    setWacPreview({
      currentWAC,
      newWAC,
      totalValue: newTotalValue,
      newTotalUnits
    });
  }, [selectedProduct, formData.quantity, formData.unitCost]);

  // Calculate WAC preview when inputs change
  useEffect(() => {
    calculateWACPreview();
  }, [calculateWACPreview]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unitCost' ? parseFloat(value) || 0 : value
    }));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData(prev => ({ ...prev, productId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (formData.quantity <= 0 || formData.unitCost <= 0) {
      setError('Please enter valid quantity and unit cost');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await InventoryService.replenishInventory(formData);
      
      if (response.success && response.transaction) {
        onSuccess?.(response.transaction);
        
        // Reset form
        setFormData({
          productId: productId || '',
          quantity: 0,
          unitCost: 0,
          supplierId: undefined,
          invoiceReference: '',
          notes: ''
        });
        
        // Reload product data
        if (selectedProduct?.id) {
          loadProduct(selectedProduct.id);
        }
      } else {
        setError(response.error || 'Failed to add inventory');
      }
    } catch (err) {
      setError('An error occurred while adding inventory');
      console.error('Error adding inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Stock Replenishment
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
        {!productId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Current Stock:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedProduct.totalUnits || selectedProduct.stock || 0} units
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Current WAC:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  ${(selectedProduct.weightedAverageCost || selectedProduct.costPrice || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Value:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  ${(selectedProduct.totalCostValue || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Reorder Point:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedProduct.reorderPoint || 0} units
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Replenishment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity to Add *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleInputChange}
              min="1"
              step="1"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit Cost ($) *
            </label>
            <input
              type="number"
              name="unitCost"
              value={formData.unitCost || ''}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* WAC Preview */}
        {wacPreview && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">WAC Calculation Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Current WAC:</span>
                <p className="font-medium text-blue-900 dark:text-blue-100">${wacPreview.currentWAC.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">New WAC:</span>
                <p className="font-medium text-blue-900 dark:text-blue-100">${wacPreview.newWAC.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">New Total Units:</span>
                <p className="font-medium text-blue-900 dark:text-blue-100">{wacPreview.newTotalUnits}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">New Total Value:</span>
                <p className="font-medium text-blue-900 dark:text-blue-100">${wacPreview.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice/Reference
            </label>
            <input
              type="text"
              name="invoiceReference"
              value={formData.invoiceReference}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Invoice number, PO reference, etc."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
            placeholder="Additional notes about this inventory replenishment..."
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
            disabled={loading || !selectedProduct || formData.quantity <= 0 || formData.unitCost <= 0}
            className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Adding Inventory...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Inventory
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};