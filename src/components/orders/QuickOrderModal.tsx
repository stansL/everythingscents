'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderItem, OrderSource, OrderStatus } from '@/lib/services/orders/types';
import { OrderService } from '@/lib/services/orders/orderService';
import { Product } from '@/lib/services/products/types';
import { ProductService } from '@/lib/services/products/productService';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order: Order) => void;
}

type FormStage = 'products' | 'customer';

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [stage, setStage] = useState<FormStage>('products');
  
  // Products stage state
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Customer stage state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStage('products');
      setItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setDeliveryMethod('pickup');
      setDeliveryAddress('');
      setDeliveryNotes('');
      setOrderNotes('');
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  // Filter products by search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add item
  const handleAddItem = (product: Product) => {
    if (!product.id) return;

    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...items];
      const item = updatedItems[existingItemIndex];
      const newQuantity = item.quantity + 1;
      const subtotal = newQuantity * item.unitPrice;
      const discountAmount = subtotal * (item.discount / 100);
      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].totalPrice = subtotal - discountAmount;
      setItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        totalPrice: product.price,
      };
      setItems([...items, newItem]);
    }
    
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...items];
    const item = updatedItems[index];
    const subtotal = newQuantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].totalPrice = subtotal - discountAmount;
    setItems(updatedItems);
  };

  // Update item discount
  const handleUpdateDiscount = (index: number, discountPercentage: number) => {
    // Clamp discount between 0 and 100
    const clampedDiscount = Math.max(0, Math.min(100, discountPercentage));
    
    const updatedItems = [...items];
    const item = updatedItems[index];
    const subtotal = item.unitPrice * item.quantity;
    const discountAmount = subtotal * (clampedDiscount / 100);
    updatedItems[index].discount = clampedDiscount;
    updatedItems[index].totalPrice = subtotal - discountAmount;
    setItems(updatedItems);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotalBeforeDiscount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => {
    const itemSubtotal = item.unitPrice * item.quantity;
    return sum + (itemSubtotal * (item.discount / 100));
  }, 0);
  const subtotal = subtotalBeforeDiscount - totalDiscount; // Subtotal after discount
  const tax = Math.round(subtotal * 0.16); // 16% VAT
  const total = subtotal + tax;

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Handle stage navigation
  const handleNext = () => {
    if (items.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }
    setError(null);
    setStage('customer');
  };

  const handleBack = () => {
    setStage('products');
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone) {
      setError('Customer name and phone are required');
      return;
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      setError('Delivery address is required for delivery orders');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData: any = {
        customerName,
        customerPhone,
        items,
        deliveryMethod,
        source: OrderSource.ADMIN,
        status: OrderStatus.PENDING,
        isPaid: false,
        createdBy: 'admin', // TODO: Replace with actual user ID from auth context
        subtotal: subtotalBeforeDiscount,
        tax,
        discountPercentage: 0,  // Overall order discount percentage (item discounts are in items)
        total,
      };

      // Only add optional fields if they have values
      if (customerEmail) orderData.customerEmail = customerEmail;
      if (orderNotes) orderData.notes = orderNotes;
      
      if (deliveryMethod === 'delivery') {
        if (deliveryAddress) orderData.deliveryAddress = deliveryAddress;
        if (deliveryNotes) orderData.deliveryNotes = deliveryNotes;
      }

      const response = await OrderService.createOrder(orderData);

      if (response.success && response.data) {
        onSuccess?.(response.data);
        onClose();
      } else {
        setError(response.error || 'Failed to create order');
      }
    } catch (err) {
      setError('An error occurred while creating the order');
      console.error('Order creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler for button click on customer stage
  const handleCreateOrder = () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
      <div className="no-scrollbar relative w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
        <div className="px-2 pr-14">
          <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            Quick Order Entry
          </h4>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {stage === 'products' ? 'Step 1: Select Products' : 'Step 2: Customer Details'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center px-2 py-2 mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-6 h-6 text-xs rounded-full ${
              stage === 'products' ? 'bg-primary text-white' : 'bg-green-500 text-white'
            }`}>
              {stage === 'customer' ? '✓' : '1'}
            </div>
            <span className={`ml-2 text-xs font-medium ${
              stage === 'products' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Products
            </span>
          </div>
          <div className="flex-shrink-0 h-px w-8 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center flex-1 justify-end">
            <span className={`mr-2 text-xs font-medium ${
              stage === 'customer' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Customer
            </span>
            <div className={`flex items-center justify-center w-6 h-6 text-xs rounded-full ${
              stage === 'customer' ? 'bg-primary text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-2 mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="custom-scrollbar h-[400px] overflow-y-auto px-2 pb-3">
          {stage === 'products' ? (
            <div className="space-y-3">
              {/* Product Search */}
              <div className="relative">
                <Label>Search Product</Label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowDropdown(searchTerm.length > 0)}
                  placeholder="Search by name or SKU"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                />
                
                {/* Dropdown */}
                  {showDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                      {filteredProducts.slice(0, 10).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => product.id && handleAddItem(product)}
                          className="w-full border-b border-gray-200 px-3 py-2 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</span>
                            <span className="text-xs font-semibold text-primary">{formatCurrency(product.price)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-xs font-bold text-gray-700 dark:text-gray-300">#</div>
                      <div className="flex-1 text-xs font-bold text-gray-700 dark:text-gray-300">Product</div>
                      <div className="w-24 text-xs font-bold text-gray-700 dark:text-gray-300 text-right">Unit Cost</div>
                      <div className="w-28 text-xs font-bold text-gray-700 dark:text-gray-300 text-center">Quantity</div>
                      <div className="w-20 text-xs font-bold text-gray-700 dark:text-gray-300 text-center">Discount</div>
                      <div className="w-24 text-xs font-bold text-gray-700 dark:text-gray-300 text-right">Total</div>
                      <div className="w-5"></div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.length === 0 ? (
                      <div className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        No items added yet. Search and add products above.
                      </div>
                    ) : (
                      items.map((item, index) => (
                        <div key={index} className="px-3 py-2 flex items-center gap-3">
                          {/* Row Number */}
                          <div className="w-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.productName}</div>
                          </div>
                          
                          <div className="w-24 text-right text-sm text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          
                          <div className="w-28 flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              −
                            </button>
                            <span className="w-12 text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="w-20 flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => handleUpdateDiscount(index, parseFloat(e.target.value) || 0)}
                              className="w-14 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="ml-0.5 text-xs text-gray-500 dark:text-gray-400">%</span>
                          </div>
                          
                          <div className="w-24 text-right font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.totalPrice)}
                          </div>
                          
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Order Summary */}
                  {items.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2 space-y-1 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(subtotalBeforeDiscount)}</span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(totalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Tax (16%):</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-1.5">
                        <span className="text-gray-900 dark:text-gray-100">Total:</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
                    Customer Information
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-x-3 gap-y-3">
                    <div>
                      <Label>Customer Name *</Label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <Label>Phone Number *</Label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        placeholder="+254712345678"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <Label>Email (Optional)</Label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
                    Delivery Information
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-x-3">
                    <div>
                      <Label>Delivery Method *</Label>
                      <div className="mt-1 space-y-2">
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="pickup"
                            checked={deliveryMethod === 'pickup'}
                            onChange={() => setDeliveryMethod('pickup')}
                            className="h-3.5 w-3.5 border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                            Pickup
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="delivery"
                            checked={deliveryMethod === 'delivery'}
                            onChange={() => setDeliveryMethod('delivery')}
                            className="h-3.5 w-3.5 border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                            Delivery
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label>Order Notes (Optional)</Label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        rows={2}
                        placeholder="Any special instructions or notes"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <div className="grid grid-cols-2 gap-x-3">
                      <div>
                        <Label>Delivery Address *</Label>
                        <textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          rows={2}
                          required
                          placeholder="Enter full delivery address"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                        />
                      </div>
                      
                      <div>
                        <Label>Delivery Notes (Optional)</Label>
                        <textarea
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          rows={2}
                          placeholder="e.g., Ring doorbell, Leave at gate"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Order Summary</h3>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Items:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Tax (16%):</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5">
                    <span className="text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </form>
            )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center gap-2 px-2 mt-4 lg:justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={stage === 'products' ? onClose : handleBack}
            disabled={loading}
          >
            {stage === 'products' ? 'Cancel' : 'Back'}
          </Button>
          <Button 
            size="sm"
            onClick={stage === 'products' ? handleNext : handleCreateOrder}
            disabled={loading || (stage === 'products' && items.length === 0)}
          >
            {loading ? 'Processing...' : stage === 'products' ? 'Next' : 'Create Order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickOrderModal;
