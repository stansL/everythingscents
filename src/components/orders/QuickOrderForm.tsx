'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderSource, OrderItem } from '@/lib/services/orders/types';
import { OrderService } from '@/lib/services/orders/orderService';
import { Product } from '@/lib/services/products/types';
import { ProductService } from '@/lib/services/products/productService';

interface QuickOrderFormProps {
  onSuccess?: (order: Order) => void;
  onCancel?: () => void;
}

export const QuickOrderForm: React.FC<QuickOrderFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // Customer info state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [notes, setNotes] = useState('');

  // Items state
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ProductService.getProducts();
        if (response.success && response.data) {
          setProducts(response.data.filter(p => p.isActive));
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };
    fetchProducts();
  }, []);

  // Filtered products for search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.16; // 16% VAT
  const total = subtotal + tax;

  // Add item to order
  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) {
      setError('Please select a product and enter a valid quantity');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existingItemIndex = items.findIndex(i => i.productId === selectedProductId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].totalPrice = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setItems(updatedItems);
    } else {
      // Add new item
      if (!product.id) return;
      
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        discount: 0,
        totalPrice: product.price * quantity,
      };
      setItems([...items, newItem]);
    }

    // Reset selection
    setSelectedProductId('');
    setQuantity(1);
    setSearchTerm('');
    setError(null);
  };

  // Remove item from order
  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const updatedItems = items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity,
        };
      }
      return item;
    });
    setItems(updatedItems);
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Customer phone is required');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      setError('Delivery address is required for delivery orders');
      return;
    }

    setLoading(true);

    try {
      const orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        items,
        subtotal,
        discountPercentage: 0,
        tax,
        total,
        status: OrderStatus.PENDING,
        source: OrderSource.ADMIN,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        notes: notes.trim() || undefined,
        isPaid: false,
        createdBy: 'admin', // TODO: Get from auth context
      };

      const response = await OrderService.createOrder(orderData);

      if (response.success && response.data) {
        onSuccess?.(response.data);
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setDeliveryMethod('pickup');
        setDeliveryAddress('');
        setDeliveryNotes('');
        setNotes('');
        setItems([]);
      } else {
        setError(response.error || 'Failed to create order');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Order creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Customer Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Customer Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="customerName" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Customer Name *
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="customerPhone" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number *
            </label>
            <input
              type="tel"
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              placeholder="+254712345678"
            />
          </div>
          <div>
            <label htmlFor="customerEmail" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email (Optional)
            </label>
            <input
              type="email"
              id="customerEmail"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Delivery Method *
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'pickup' | 'delivery')}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  Pickup
                </span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'pickup' | 'delivery')}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  Delivery
                </span>
              </label>
            </div>
          </div>
        </div>

        {deliveryMethod === 'delivery' && (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="deliveryAddress" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery Address *
              </label>
              <textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Enter delivery address"
              />
            </div>
            <div>
              <label htmlFor="deliveryNotes" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery Notes (Optional)
              </label>
              <input
                type="text"
                id="deliveryNotes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Building name, floor, etc."
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Order Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            placeholder="Special instructions or notes"
          />
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Order Items
        </h3>

        {/* Add Item Section */}
        <div className="mb-4 space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label htmlFor="productSearch" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Product
              </label>
              <input
                type="text"
                id="productSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                placeholder="Search by name or SKU"
              />
              {searchTerm && filteredProducts.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        if (product.id) {
                          setSelectedProductId(product.id);
                          setSearchTerm(product.name);
                        }
                      }}
                      className="w-full border-b border-gray-200 px-4 py-2 text-left text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {product.sku} • KES {product.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="quantity" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!selectedProductId}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Item
          </button>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No items added yet. Search and add products above.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{item.productName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    KES {item.unitPrice.toFixed(2)} × {item.quantity} = KES {item.totalPrice.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.productId)}
                    className="ml-2 rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Summary */}
        {items.length > 0 && (
          <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">KES {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax (16%):</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">KES {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-gray-700">
              <span className="text-gray-900 dark:text-gray-100">Total:</span>
              <span className="text-primary">KES {total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </div>
    </form>
  );
};

export default QuickOrderForm;
