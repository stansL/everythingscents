'use client';

import React, { useState } from 'react';
import { useModal } from '@/hooks/useModal';
import { Modal } from '@/components/ui/modal';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { InvoiceErrorBoundary } from '@/components/common/InvoiceErrorBoundary';
import { FirestoreService } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

// Invoice status enum
enum InvoiceStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  company?: string;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface SavedInvoice {
  id?: string;
  invoiceNumber: string;
  customer: Customer;
  items: Product[];
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  dateCreated: string;
  dateFinalized?: string;
  dateSent?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export default function CreateInvoicePage() {
  const { isOpen: isPreviewOpen, openModal: openPreview, closeModal: closePreview } = useModal();
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>(InvoiceStatus.DRAFT);
  const [notes, setNotes] = useState('');
  
  // Date states - setters not used yet but available for future functionality
  const issueDate = new Date();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Sample customer data - in real app this would come from API
  const [customers] = useState<Customer[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', address: '123 Main St, New York, NY 10001', company: 'Acme Corp' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', address: '456 Oak Ave, Los Angeles, CA 90210', company: 'Tech Solutions Inc' },
    { id: '3', name: 'Robert Johnson', email: 'robert@example.com', address: '789 Pine Rd, Chicago, IL 60601' },
    { id: '4', name: 'Emily Davis', email: 'emily@example.com', address: '321 Elm St, Houston, TX 77001', company: 'Creative Agency' },
    { id: '5', name: 'Michael Wilson', email: 'michael@example.com', address: '654 Maple Dr, Phoenix, AZ 85001' },
    { id: '6', name: 'Sarah Brown', email: 'sarah@example.com', address: '987 Cedar Ln, Philadelphia, PA 19101', company: 'Digital Marketing Co' },
    { id: '7', name: 'David Miller', email: 'david@example.com', address: '147 Birch St, San Antonio, TX 78201' },
    { id: '8', name: 'Lisa Garcia', email: 'lisa@example.com', address: '258 Spruce Ave, San Diego, CA 92101', company: 'Consulting Group' }
  ]);
  
  // Sample product data - in real app this would come from API
  const [availableProducts] = useState<ProductData[]>([
    { id: '1', name: 'Macbook pro 13"', price: 1200, category: 'Electronics', description: 'Apple MacBook Pro 13-inch with M2 chip' },
    { id: '2', name: 'Apple Watch Ultra', price: 300, category: 'Electronics', description: 'Latest Apple Watch with GPS and Cellular' },
    { id: '3', name: 'iPhone 15 Pro Max', price: 800, category: 'Electronics', description: 'Latest iPhone with Pro camera system' },
    { id: '4', name: 'iPad Pro 3rd Gen', price: 900, category: 'Electronics', description: 'iPad Pro with M1 chip and Liquid Retina display' },
    { id: '5', name: 'AirPods Pro', price: 250, category: 'Electronics', description: 'Wireless earbuds with active noise cancellation' },
    { id: '6', name: 'Magic Keyboard', price: 150, category: 'Accessories', description: 'Wireless keyboard for Mac and iPad' },
    { id: '7', name: 'Magic Mouse', price: 80, category: 'Accessories', description: 'Wireless multi-touch mouse' },
    { id: '8', name: 'Studio Display', price: 1599, category: 'Electronics', description: '27-inch 5K Retina display' },
    { id: '9', name: 'MacBook Air M2', price: 999, category: 'Electronics', description: 'MacBook Air with M2 chip' },
    { id: '10', name: 'Apple TV 4K', price: 179, category: 'Electronics', description: 'Apple TV with 4K HDR and Dolby Vision' },
    { id: '11', name: 'HomePod mini', price: 99, category: 'Electronics', description: 'Smart speaker with Siri' },
    { id: '12', name: 'Lightning Cable', price: 19, category: 'Accessories', description: 'USB-C to Lightning cable' }
  ]);
  
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Macbook pro 13"', price: 1200, quantity: 1, discount: 0, total: 1200 },
    { id: 2, name: 'Apple Watch Ultra', price: 300, quantity: 1, discount: 50, total: 150 },
    { id: 3, name: 'iPhone 15 Pro Max', price: 800, quantity: 2, discount: 0, total: 1600 },
    { id: 4, name: 'iPad Pro 3rd Gen', price: 900, quantity: 1, discount: 0, total: 900 }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    quantity: 1,
    discount: 0
  });
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.company?.toLowerCase().includes(customerSearch.toLowerCase())
  );
  
  // Filter products based on search term
  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerAddress(customer.address);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setCustomerName(value);
    setShowCustomerDropdown(value.length > 0);
    
    // If exact match found, auto-fill address
    const exactMatch = customers.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (exactMatch) {
      setCustomerAddress(exactMatch.address);
    } else if (value === '') {
      setCustomerAddress('');
    }
  };
  
  const handleProductSelect = (product: ProductData) => {
    setNewProduct({
      ...newProduct,
      name: product.name,
      price: product.price
    });
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const handleProductSearchChange = (value: string) => {
    setProductSearch(value);
    setNewProduct({ ...newProduct, name: value });
    setShowProductDropdown(value.length > 0);
    
    // If exact match found, auto-fill price
    const exactMatch = availableProducts.find(p => p.name.toLowerCase() === value.toLowerCase());
    if (exactMatch) {
      setNewProduct({ ...newProduct, name: value, price: exactMatch.price });
    }
  };

  const calculateProductTotal = (price: number, quantity: number, discount: number): number => {
    const subtotal = price * quantity;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.price > 0) {
      const total = calculateProductTotal(newProduct.price, newProduct.quantity, newProduct.discount);
      
      if (isEditing && editingProduct) {
        // Update existing product
        const updatedProducts = products.map(p => 
          p.id === editingProduct.id 
            ? {
                ...p,
                name: newProduct.name,
                price: newProduct.price,
                quantity: newProduct.quantity,
                discount: newProduct.discount,
                total: total
              }
            : p
        );
        setProducts(updatedProducts);
        setEditingProduct(null);
        setIsEditing(false);
      } else {
        // Add new product
        const product: Product = {
          id: Date.now(),
          name: newProduct.name,
          price: newProduct.price,
          quantity: newProduct.quantity,
          discount: newProduct.discount,
          total: total
        };
        setProducts([...products, product]);
      }
      
      setNewProduct({ name: '', price: 0, quantity: 1, discount: 0 });
      setProductSearch('');
      setShowProductDropdown(false);
    }
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    // If we're editing the product being removed, cancel edit
    if (editingProduct && editingProduct.id === id) {
      cancelEdit();
    }
  };
  
  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditing(true);
    setNewProduct({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      discount: product.discount
    });
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };
  
  const cancelEdit = () => {
    setEditingProduct(null);
    setIsEditing(false);
    setNewProduct({ name: '', price: 0, quantity: 1, discount: 0 });
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addProduct();
    }
  };

  const subTotalBeforeDiscount = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const totalDiscountAmount = products.reduce((sum, product) => {
    const itemSubtotal = product.price * product.quantity;
    const itemDiscount = (itemSubtotal * product.discount) / 100;
    return sum + itemDiscount;
  }, 0);
  const subTotal = products.reduce((sum, product) => sum + product.total, 0);
  const vatRate = 10;
  const vatAmount = (subTotal * vatRate) / 100;
  const totalAmount = subTotal + vatAmount;

  // Format currency with thousand separators
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Load invoice data from a saved invoice
  const loadInvoiceData = (invoiceData: SavedInvoice) => {
    try {
      // Set customer data
      if (invoiceData.customer) {
        setSelectedCustomer(invoiceData.customer);
        setCustomerName(invoiceData.customer.name);
        setCustomerAddress(invoiceData.customer.address);
        setCustomerSearch(invoiceData.customer.name);
      }

      // Set invoice number
      if (invoiceData.invoiceNumber) {
        setInvoiceNumber(invoiceData.invoiceNumber);
      }

      // Set products
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        setProducts(invoiceData.items.map((item: Product, index: number) => ({
          id: index + 1,
          name: item.name || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          discount: item.discount || 0,
          total: item.total || 0
        })));
      }

      // Set status and notes
      if (invoiceData.status) {
        setInvoiceStatus(invoiceData.status);
      }
      if (invoiceData.notes) {
        setNotes(invoiceData.notes);
      }

      // Show success message
      setSaveMessage('Invoice data loaded successfully!');
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveMessage('');
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error loading invoice data:', error);
      setSaveMessage('Error loading invoice data');
      setSaveSuccess(false);
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    }
  };

  // Save invoice as draft
  const saveDraft = async () => {
    if (!selectedCustomer) {
      setSaveMessage('Please select a customer before saving.');
      setSaveSuccess(false);
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    if (products.length === 0) {
      setSaveMessage('Please add at least one item before saving.');
      setSaveSuccess(false);
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    
    try {
      const invoiceData: Omit<SavedInvoice, 'id'> = {
        invoiceNumber,
        customer: selectedCustomer,
        items: products,
        subTotal,
        vatAmount,
        totalAmount,
        status: InvoiceStatus.DRAFT,
        dateCreated: new Date().toISOString(),
        notes
      };

      await FirestoreService.create('invoices', invoiceData);
      
      setSaveMessage('Draft saved successfully!');
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveMessage('Error saving draft. Please try again.');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveMessage('');
        setSaveSuccess(false);
      }, 3000);
    }
  };

  // Finalize invoice (convert from draft to finalized)
  const finalizeInvoice = async () => {
    if (!selectedCustomer) {
      setSaveMessage('Please select a customer before finalizing.');
      setSaveSuccess(false);
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    if (products.length === 0) {
      setSaveMessage('Please add at least one item before finalizing.');
      setSaveSuccess(false);
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    
    try {
      const finalizedInvoiceData: Omit<SavedInvoice, 'id'> = {
        invoiceNumber,
        customer: selectedCustomer,
        items: products,
        subTotal,
        vatAmount,
        totalAmount,
        status: InvoiceStatus.FINALIZED,
        dateCreated: new Date().toISOString(),
        dateFinalized: new Date().toISOString(),
        notes
      };

      await FirestoreService.create('invoices', finalizedInvoiceData);
      
      setSaveMessage('Invoice finalized successfully!');
      setSaveSuccess(true);
      setInvoiceStatus(InvoiceStatus.FINALIZED);
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      setSaveMessage('Error finalizing invoice. Please try again.');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveMessage('');
        setSaveSuccess(false);
      }, 3000);
    }
  };

  // PDF generation function
  const generatePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text('INVOICE', 20, 30);
    
    // Invoice details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice Number: ${invoiceNumber}`, 20, 45);
    doc.text(`Issue Date: ${issueDate.toLocaleDateString()}`, 20, 52);
    doc.text(`Due Date: ${dueDate.toLocaleDateString()}`, 20, 59);
    
    // Company details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('From:', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Everything Scents LLC', 20, 85);
    doc.text('123 Business Street', 20, 92);
    doc.text('New York, NY 10001', 20, 99);
    doc.text('contact@everythingscents.com', 20, 106);
    doc.text('+1 (555) 123-4567', 20, 113);
    
    // Customer details
    if (selectedCustomer) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('To:', 120, 75);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(selectedCustomer.name, 120, 85);
      doc.text(selectedCustomer.email, 120, 92);
      doc.text(selectedCustomer.address, 120, 99);
      if (selectedCustomer.company) {
        doc.text(selectedCustomer.company, 120, 106);
      }
    }
    
    // Items table header
    let yPosition = 130;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Items', 20, yPosition);
    
    yPosition += 10;
    
    // Only show table if there are products
    if (products.length > 0) {
      // Table headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('#', 20, yPosition);
      doc.text('Product', 30, yPosition);
      doc.text('Qty', 100, yPosition);
      doc.text('Unit Cost', 120, yPosition);
      doc.text('Discount', 145, yPosition);
      doc.text('Total', 170, yPosition);
      
      // Draw line under headers
      doc.setLineWidth(0.5);
      doc.line(20, yPosition + 2, 190, yPosition + 2);
      
      yPosition += 8;
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      products.forEach((product, index) => {
        doc.text((index + 1).toString(), 20, yPosition);
        // Truncate long product names if needed
        const productName = product.name.length > 25 ? product.name.substring(0, 22) + '...' : product.name;
        doc.text(productName, 30, yPosition);
        doc.text(product.quantity.toString(), 100, yPosition);
        doc.text(formatCurrency(product.price).replace('$', '$'), 120, yPosition);
        doc.text(`${product.discount}%`, 145, yPosition);
        doc.text(formatCurrency(product.total).replace('$', '$'), 170, yPosition);
        yPosition += 7;
      });
      
      yPosition += 5;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No items added to this invoice.', 30, yPosition + 10);
      yPosition += 20;
    }
    
    // Summary section
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Order Summary', 20, yPosition);
    yPosition += 12;
    
    // Calculate summary values
    const calculatedSubTotalBeforeDiscount = products.reduce((sum, product) => {
      return sum + (product.price * product.quantity);
    }, 0);
    
    const calculatedTotalDiscountAmount = products.reduce((sum, product) => {
      const itemTotal = product.price * product.quantity;
      const discountAmount = itemTotal * (product.discount / 100);
      return sum + discountAmount;
    }, 0);
    
    const calculatedSubTotal = calculatedSubTotalBeforeDiscount - calculatedTotalDiscountAmount;
    const calculatedVatAmount = calculatedSubTotal * 0.1;
    const calculatedTotalAmount = calculatedSubTotal + calculatedVatAmount;
    
    // Summary details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.text('Sub Total (Before Discount):', 120, yPosition);
    doc.text(formatCurrency(calculatedSubTotalBeforeDiscount).replace('$', '$'), 170, yPosition);
    yPosition += 7;
    
    if (calculatedTotalDiscountAmount > 0) {
      doc.text('Total Discount:', 120, yPosition);
      doc.text(`-${formatCurrency(calculatedTotalDiscountAmount).replace('$', '$')}`, 170, yPosition);
      yPosition += 7;
    }
    
    doc.text('Sub Total (After Discount):', 120, yPosition);
    doc.text(formatCurrency(calculatedSubTotal).replace('$', '$'), 170, yPosition);
    yPosition += 7;
    
    doc.text('VAT (10%):', 120, yPosition);
    doc.text(formatCurrency(calculatedVatAmount).replace('$', '$'), 170, yPosition);
    yPosition += 10;
    
    // Total line
    doc.setLineWidth(0.8);
    doc.line(120, yPosition - 2, 190, yPosition - 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', 120, yPosition + 5);
    doc.text(formatCurrency(calculatedTotalAmount).replace('$', '$'), 170, yPosition + 5);
    
    // Save the PDF
    doc.save(`invoice-${invoiceNumber}.pdf`);
  };

  return (
    <InvoiceErrorBoundary>
      <div className="space-y-6">
        <PageBreadcrumb 
          pageTitle="Create Invoice" 
          items={[
            { label: "Home", href: "/" },
            { label: "Invoices", href: "/invoices" },
            { label: "Create Invoice" }
          ]}
        />
        
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Invoice</h1>
        </div>

        {/* Invoice Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearchChange(e.target.value)}
                onFocus={() => setShowCustomerDropdown(customerSearch.length > 0)}
                placeholder="Search customers..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* Customer Dropdown */}
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</div>
                      {customer.company && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">{customer.company}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Address
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Invoice Products and Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">

          {/* Products Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">S.No.#</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Products</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Cost</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Discount</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{index + 1}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {product.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(product.price)}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {product.discount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          {product.discount}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.total)}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => editProduct(product)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-md transition-colors"
                          title="Edit product"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-md transition-colors"
                          title="Remove product"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 px-6 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm font-medium">No items added yet</p>
                        <p className="text-xs">Add products below to create your invoice</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add/Edit Product Section */}
          <div className={`rounded-lg p-6 mb-6 ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
            {isEditing && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Update Product: {editingProduct?.name}</span>
                </div>
                <button
                  onClick={cancelEdit}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => handleProductSearchChange(e.target.value)}
                  onFocus={() => setShowProductDropdown(productSearch.length > 0)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Product Dropdown */}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{product.category}</div>
                            {product.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.description}</div>
                            )}
                          </div>
                          <div className="font-semibold text-blue-600 dark:text-blue-400 ml-2">{formatCurrency(product.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  value={newProduct.price > 0 ? formatCurrency(newProduct.price) : ''}
                  readOnly
                  placeholder="Select product to see price"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newProduct.discount}
                  onChange={(e) => setNewProduct({ ...newProduct, discount: parseFloat(e.target.value) || 0 })}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={addProduct}
                  className={`w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                    isEditing 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isEditing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400">
              After filling in the product details, press Enter/Return or click &apos;Add Product&apos; to add it to the list.
            </p>
          </div>

          {/* Notes and Order Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes Section */}
            <div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or special instructions for this invoice..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={6}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sub Total (Before Discount)</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subTotalBeforeDiscount)}</span>
                  </div>
                  
                  {totalDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Discount</span>
                      <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(totalDiscountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sub Total (After Discount)</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subTotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Vat ({vatRate}%):</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(vatAmount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Feedback Message */}
          {saveMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              saveSuccess 
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {saveSuccess ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{saveMessage}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={openPreview}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Preview Invoice
            </button>
            
            {/* Save as Draft Button */}
            <button 
              onClick={saveDraft}
              disabled={isSaving}
              className={`px-6 py-2 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg transition-colors flex items-center gap-2 ${
                isSaving 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Save as Draft
                </>
              )}
            </button>

            {/* Finalize Invoice Button */}
            <button 
              onClick={finalizeInvoice}
              disabled={isSaving}
              className={`px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isSaving 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Finalizing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Finalize Invoice
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved Invoices List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Invoices</h3>
          <div className="space-y-2">
            {(() => {
              // For demo purposes, show a message about Firebase integration
              // In a real implementation, you would use React.useEffect to load from Firebase
              const demoMessage = (
                <div className="text-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Firebase Integration Active</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Invoices are now saved to Firebase. Recent invoices will appear here once saved.
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                        • <strong>Draft</strong>: Work in progress, can be edited<br/>
                        • <strong>Finalized</strong>: Complete and ready to send to customer
                      </p>
                    </div>
                  </div>
                </div>
              );
              
              // Show the demo message for now
              // TODO: Replace with actual Firebase data loading using useEffect
              return demoMessage;
            })()}
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={closePreview} className="max-w-[900px] m-4">
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
              font-family: 'Helvetica', 'Arial', sans-serif;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            .print-content h4 {
              color: #3b82f6 !important;
              font-size: 28px !important;
              margin-bottom: 8px !important;
            }
            .print-content h5 {
              color: #000 !important;
              font-size: 18px !important;
            }
            .print-content table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            .print-content th {
              background-color: #f9fafb !important;
              color: #6b7280 !important;
              padding: 12px !important;
              border: 1px solid #e5e7eb !important;
              font-size: 11px !important;
              text-transform: uppercase;
            }
            .print-content td {
              padding: 12px !important;
              border: 1px solid #e5e7eb !important;
              font-size: 13px !important;
            }
            .print-badge {
              background-color: #dbeafe !important;
              color: #1d4ed8 !important;
              padding: 4px 8px !important;
              border-radius: 12px !important;
              font-size: 11px !important;
            }
            .print-discount-badge {
              background-color: #fecaca !important;
              color: #dc2626 !important;
              padding: 4px 8px !important;
              border-radius: 12px !important;
              font-size: 11px !important;
            }
            .print-summary {
              margin-top: 20px !important;
              padding-top: 16px !important;
              border-top: 1px solid #e5e7eb !important;
            }
          }
        `}</style>
        <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11 print-content">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 print-only" style={{display: 'none'}}>
              INVOICE
            </h4>
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 no-print">
              Invoice Preview
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7 no-print">
              Review your invoice before sending to the customer.
            </p>
          </div>

          <div className="custom-scrollbar h-[600px] overflow-y-auto px-2 pb-3">
            {/* Company Details */}
            <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h5 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                    From:
                  </h5>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Everything Scents LLC
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      123 Business Street
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      New York, NY 10001
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      contact@everythingscents.com
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                    To:
                  </h5>
                  {selectedCustomer ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCustomer.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCustomer.address}
                      </p>
                      {selectedCustomer.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedCustomer.company}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No customer selected
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Invoice Number
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Issue Date
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {issueDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Due Date
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {dueDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h5 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                Items
              </h5>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        S.No.#
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {products.length > 0 ? (
                      products.map((product, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 print-badge">
                              {product.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.discount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 print-discount-badge">
                                {product.discount}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(product.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500 dark:text-gray-400">
                            <p className="text-sm font-medium">No items added</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700 print-summary">
              <div className="ml-auto max-w-sm">
                <h5 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white text-right">
                  Order Summary
                </h5>
                <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sub Total (Before Discount):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subTotalBeforeDiscount)}
                  </span>
                </div>
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Discount:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(totalDiscountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sub Total (After Discount):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">VAT (10%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(vatAmount)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Total Amount:
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end no-print">
            <button
              onClick={closePreview}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Invoice ${invoiceNumber}`,
                    text: `Invoice ${invoiceNumber} for ${selectedCustomer?.name || 'Customer'}`,
                    url: window.location.href
                  });
                } else {
                  // Fallback - copy to clipboard
                  navigator.clipboard.writeText(window.location.href);
                  alert('Invoice link copied to clipboard!');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </Modal>
    </InvoiceErrorBoundary>
  );
}