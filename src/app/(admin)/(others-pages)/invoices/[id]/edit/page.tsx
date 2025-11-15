'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useModal } from '@/hooks/useModal';
import { Modal } from '@/components/ui/modal';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { InvoiceErrorBoundary } from '@/components/common/InvoiceErrorBoundary';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { Invoice, InvoiceItem } from '@/lib/services/invoices/types';
import { formatAmountFromCents } from '@/lib/utils/formatters';
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

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
  
  const { isOpen: isPreviewOpen, openModal: openPreview, closeModal: closePreview } = useModal();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>(InvoiceStatus.DRAFT);
  const [notes, setNotes] = useState('');
  
  // Date states
  const [issueDate, setIssueDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
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
  
  const [products, setProducts] = useState<Product[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    quantity: 1,
    discount: 0
  });
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing invoice data
  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await InvoiceService.getInvoiceById(invoiceId);
        
        if (response.success && response.data) {
          const invoice = response.data;
          setOriginalInvoice(invoice);
          
          // Pre-populate form fields
          setInvoiceNumber(`INV-${invoice.id}`);
          setCustomerName(invoice.clientName);
          setCustomerEmail(invoice.clientEmail || '');
          setCustomerAddress(invoice.clientAddress || '');
          setCustomerSearch(invoice.clientName);
          setIssueDate(new Date(invoice.issueDate));
          setDueDate(new Date(invoice.dueDate));
          setNotes(invoice.notes || '');
          
          // Map status
          const statusMap: { [key: string]: InvoiceStatus } = {
            'draft': InvoiceStatus.DRAFT,
            'paid': InvoiceStatus.PAID,
            'unpaid': InvoiceStatus.SENT
          };
          setInvoiceStatus(statusMap[invoice.status] || InvoiceStatus.DRAFT);
          
          // Convert invoice items to products format
          if (invoice.items?.length) {
            const convertedProducts: Product[] = invoice.items.map((item, index) => ({
              id: index + 1,
              name: item.description,
              price: item.rate / 100, // Convert from cents
              quantity: item.quantity,
              discount: (item.discount || 0) / 100, // Convert from cents
              total: ((item.amount - (item.discount || 0)) / 100) // Convert from cents
            }));
            setProducts(convertedProducts);
          }
          
          // Try to match with existing customer
          const matchingCustomer = customers.find(
            c => c.name.toLowerCase() === invoice.clientName.toLowerCase() ||
                 c.email.toLowerCase() === (invoice.clientEmail || '').toLowerCase()
          );
          if (matchingCustomer) {
            setSelectedCustomer(matchingCustomer);
          }
          
        } else {
          setError(response.error || 'Invoice not found');
        }
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, customers]);

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
    setCustomerEmail(customer.email);
    setCustomerAddress(customer.address);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setCustomerName(value);
    setShowCustomerDropdown(true);
    
    // If search matches a customer exactly, select them
    const exactMatch = customers.find(c => 
      c.name.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setSelectedCustomer(exactMatch);
      setCustomerEmail(exactMatch.email);
      setCustomerAddress(exactMatch.address);
    } else {
      setSelectedCustomer(null);
    }
  };

  const handleProductSelect = (product: ProductData) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      quantity: 1,
      discount: 0
    });
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const addProduct = () => {
    if (!newProduct.name || newProduct.price <= 0) return;
    
    const total = (newProduct.price * newProduct.quantity) - newProduct.discount;
    const product: Product = {
      id: Math.max(0, ...products.map(p => p.id)) + 1,
      name: newProduct.name,
      price: newProduct.price,
      quantity: newProduct.quantity,
      discount: newProduct.discount,
      total: Math.max(0, total)
    };
    
    setProducts([...products, product]);
    setNewProduct({ name: '', price: 0, quantity: 1, discount: 0 });
    setProductSearch('');
  };

  const updateProduct = (id: number, updates: Partial<Product>) => {
    setProducts(products.map(product => {
      if (product.id === id) {
        const updated = { ...product, ...updates };
        updated.total = Math.max(0, (updated.price * updated.quantity) - updated.discount);
        return updated;
      }
      return product;
    }));
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const startEditingProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditing(true);
  };

  const cancelEditingProduct = () => {
    setEditingProduct(null);
    setIsEditing(false);
  };

  const saveEditingProduct = () => {
    if (editingProduct) {
      updateProduct(editingProduct.id, editingProduct);
      setEditingProduct(null);
      setIsEditing(false);
    }
  };

  const updateEditingProduct = (updates: Partial<Product>) => {
    if (editingProduct) {
      const updated = { ...editingProduct, ...updates };
      updated.total = Math.max(0, (updated.price * updated.quantity) - updated.discount);
      setEditingProduct(updated);
    }
  };

  // Calculate totals
  const subTotal = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const totalDiscount = products.reduce((sum, product) => sum + product.discount, 0);
  const vatRate = 0.1; // 10% VAT
  const vatAmount = (subTotal - totalDiscount) * vatRate;
  const totalAmount = subTotal - totalDiscount + vatAmount;

  const handleSaveInvoice = async (status: InvoiceStatus = invoiceStatus) => {
    if (!customerName || products.length === 0) {
      setSaveMessage('Please fill in customer details and add at least one product');
      setSaveSuccess(false);
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Convert products back to InvoiceItem format
      const invoiceItems: InvoiceItem[] = products.map(product => ({
        description: product.name,
        quantity: product.quantity,
        rate: Math.round(product.price * 100), // Convert to cents
        amount: Math.round((product.price * product.quantity) * 100), // Convert to cents
        discount: Math.round(product.discount * 100) // Convert to cents
      }));

      // Prepare updated invoice data
      const updatedInvoice = {
        clientName: customerName,
        clientEmail: customerEmail || undefined,
        clientAddress: customerAddress || undefined,
        issueDate,
        dueDate,
        amount: Math.round(totalAmount * 100), // Convert to cents
        items: invoiceItems,
        subtotal: Math.round(subTotal * 100), // Convert to cents
        taxAmount: Math.round(vatAmount * 100), // Convert to cents
        discountAmount: Math.round(totalDiscount * 100), // Convert to cents
        status: status === InvoiceStatus.PAID ? 'paid' : 
                status === InvoiceStatus.DRAFT ? 'draft' : 'unpaid',
        notes: notes || undefined,
        updatedAt: new Date()
      };

      // Update invoice via service
      const response = await InvoiceService.updateInvoice(invoiceId, updatedInvoice);
      
      if (response.success) {
        setSaveSuccess(true);
        setSaveMessage(`Invoice ${invoiceNumber} updated successfully!`);
        
        // Redirect to invoice view after a short delay
        setTimeout(() => {
          router.push(`/invoices/${invoiceId}`);
        }, 2000);
      } else {
        setSaveSuccess(false);
        setSaveMessage(response.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      setSaveSuccess(false);
      setSaveMessage('An error occurred while updating the invoice');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <InvoiceErrorBoundary>
        <div className="space-y-6">
          <PageBreadcrumb 
            pageTitle="Edit Invoice" 
            items={[
              { label: "Home", href: "/" },
              { label: "Invoices", href: "/invoices" },
              { label: originalInvoice ? `Invoice #${originalInvoice.id}` : "Loading...", href: originalInvoice ? `/invoices/${originalInvoice.id}` : undefined },
              { label: "Edit" }
            ]}
          />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </InvoiceErrorBoundary>
    );
  }

  // Error state
  if (error || !originalInvoice) {
    return (
      <InvoiceErrorBoundary>
        <div className="space-y-6">
          <PageBreadcrumb 
            pageTitle="Edit Invoice" 
            items={[
              { label: "Home", href: "/" },
              { label: "Invoices", href: "/invoices" },
              { label: "Edit Invoice" }
            ]}
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {error === 'Invoice not found' ? 'Invoice Not Found' : 'Error Loading Invoice'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => router.push('/invoices')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </InvoiceErrorBoundary>
    );
  }

  return (
    <InvoiceErrorBoundary>
      <div className="space-y-6">
        <PageBreadcrumb 
          pageTitle={`Edit Invoice #${originalInvoice.id}`} 
          items={[
            { label: "Home", href: "/" },
            { label: "Invoices", href: "/invoices" },
            { label: `Invoice #${originalInvoice.id}`, href: `/invoices/${originalInvoice.id}` },
            { label: "Edit" }
          ]}
        />
        
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Edit Invoice #{originalInvoice.id}</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              invoiceStatus === InvoiceStatus.DRAFT
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                : invoiceStatus === InvoiceStatus.SENT
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : invoiceStatus === InvoiceStatus.PAID
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                : invoiceStatus === InvoiceStatus.OVERDUE
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {invoiceStatus.toUpperCase()}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last updated on {new Date(originalInvoice.updatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`p-4 rounded-lg border ${
            saveSuccess 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Invoice & Customer Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Invoice Details - Column 1 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Invoice Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Issue Date:
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">
                    {issueDate.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Due Date:
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">
                    {dueDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information - Column 2 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Name:
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">
                    {customerName || customerSearch || 'No customer selected'}
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Email:
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm break-all">
                    {customerEmail || 'No email provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Information - Column 3 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Address Information</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Billing Address
                </label>
                <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                  {customerAddress || 'No address provided'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products & Services */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Products & Services</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Modify products below to update your invoice</p>
            </div>
          </div>

          {/* Products Table - Same design as create page */}
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
                    {isEditing && editingProduct?.id === product.id ? (
                      <>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{index + 1}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <input
                            type="text"
                            value={editingProduct.name}
                            onChange={(e) => updateEditingProduct({ name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            value={editingProduct.quantity}
                            onChange={(e) => updateEditingProduct({ quantity: parseInt(e.target.value) || 1 })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingProduct.price}
                            onChange={(e) => updateEditingProduct({ price: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingProduct.discount}
                            onChange={(e) => updateEditingProduct({ discount: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">${editingProduct.total.toFixed(2)}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveEditingProduct}
                              className="inline-flex items-center px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded transition-colors"
                              title="Save"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={cancelEditingProduct}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{index + 1}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {product.quantity}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">${product.price.toFixed(2)}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {product.discount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              {product.discount}%
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">${product.total.toFixed(2)}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => startEditingProduct(product)}
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
                      </>
                    )}
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
                        <p className="text-xs">Add products using the form below</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Product Section - Same style as create page */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setNewProduct({ ...newProduct, name: e.target.value });
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Product Dropdown */}
                {showProductDropdown && filteredProducts.length > 0 && productSearch && (
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
                          <div className="font-semibold text-blue-600 dark:text-blue-400 ml-2">${product.price.toFixed(2)}</div>
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
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={newProduct.discount || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={addProduct}
                  className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Fill in the product details and click &apos;Add Product&apos; to add it to the invoice.
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
                    <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                    <span className="font-medium text-gray-900 dark:text-white">${subTotal.toFixed(2)}</span>
                  </div>
                  
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Discount</span>
                      <span className="font-medium text-red-600 dark:text-red-400">-${totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">VAT (10%)</span>
                    <span className="font-medium text-gray-900 dark:text-white">${vatAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>





        {/* Invoice Status & Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Status & Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Status
              </label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={InvoiceStatus.DRAFT}>Draft</option>
                <option value={InvoiceStatus.SENT}>Sent</option>
                <option value={InvoiceStatus.PAID}>Paid</option>
                <option value={InvoiceStatus.OVERDUE}>Overdue</option>
                <option value={InvoiceStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-end gap-3">
              <button
                onClick={() => router.push(`/invoices/${invoiceId}`)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveInvoice(InvoiceStatus.DRAFT)}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSaveInvoice()}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Update Invoice'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={closePreview}
          title="Invoice Preview"
          size="xl"
        >
          <div className="space-y-6">
            {/* Invoice Preview Content */}
            <div className="bg-white p-8 rounded-lg">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-gray-600">Invoice Number: {invoiceNumber}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
                  <div className="text-gray-700">
                    <p className="font-medium">{customerName}</p>
                    {customerEmail && <p>{customerEmail}</p>}
                    {customerAddress && (
                      <div className="mt-1 whitespace-pre-line">{customerAddress}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Details:</h3>
                  <div className="text-gray-700">
                    <p>Issue Date: {issueDate.toLocaleDateString()}</p>
                    <p>Due Date: {dueDate.toLocaleDateString()}</p>
                    <p>Status: <span className="capitalize">{invoiceStatus.toLowerCase()}</span></p>
                  </div>
                </div>
              </div>
              
              {products.length > 0 && (
                <div className="mb-8">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left">Product/Service</th>
                        <th className="border border-gray-300 p-3 text-right">Price</th>
                        <th className="border border-gray-300 p-3 text-center">Qty</th>
                        <th className="border border-gray-300 p-3 text-right">Discount</th>
                        <th className="border border-gray-300 p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="border border-gray-300 p-3">{product.name}</td>
                          <td className="border border-gray-300 p-3 text-right">${product.price.toFixed(2)}</td>
                          <td className="border border-gray-300 p-3 text-center">{product.quantity}</td>
                          <td className="border border-gray-300 p-3 text-right">${product.discount.toFixed(2)}</td>
                          <td className="border border-gray-300 p-3 text-right">${product.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Discount:</span>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (10%):</span>
                      <span>${vatAmount.toFixed(2)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
                  <p className="text-gray-700 whitespace-pre-line">{notes}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </InvoiceErrorBoundary>
  );
}