'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { InvoiceErrorBoundary } from "@/components/common/InvoiceErrorBoundary";
import { InvoiceMetricsSkeleton, InvoiceControlsSkeleton, InvoiceTableSkeleton } from "@/components/common/LoadingSkeleton";
import { useModal } from '@/hooks/useModal';

import {
  InvoiceMetricsDashboard,
  InvoiceControlsBar,
  InvoiceDataTable,
  type SortConfig
} from '@/components/invoices';
import InvoiceDeleteModal from '@/components/invoices/InvoiceDeleteModal';
import { 
  Invoice, 
  FilterOptions, 
  Customer,
  Category 
} from '@/lib/services/invoices/types';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { mockCustomers, mockCategories } from '@/lib/services/invoices/mockData';
import { PerformanceTracker } from '@/lib/utils/performance';

// Note: InvoiceService uses static methods

export default function InvoicesPage() {
  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers] = useState<Customer[]>(mockCustomers);
  const [categories] = useState<Category[]>(mockCategories);
  
  // Filter and search state
  const [filters, setFilters] = useState<Partial<FilterOptions>>({ status: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Selection state
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  
  // Modal states
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  // Router
  const router = useRouter();
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, [currentPage, itemsPerPage, filters, searchTerm, sortConfig]);

  // Set document title and track page performance
  useEffect(() => {
    document.title = 'Everything Scents - Invoices';
    PerformanceTracker.trackPageLoad('invoices_page');
    
    return () => {
      document.title = 'Everything Scents Admin';
    };
  }, []);
  
  // Filtered, sorted, and paginated data
  const { paginatedInvoices, totalFiltered } = useMemo(() => {
    let filtered = [...invoices];
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.clientName.toLowerCase().includes(term) ||
        invoice.id.toLowerCase().includes(term) ||
        (invoice.clientEmail && invoice.clientEmail.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      // Convert category IDs to category names for matching
      const selectedCategoryNames = filters.categoryIds.map(categoryId => 
        categories.find(cat => cat.id === categoryId)?.name
      ).filter(Boolean);
      
      filtered = filtered.filter(invoice => 
        invoice.category && selectedCategoryNames.includes(invoice.category)
      );
    }
    
    // Apply customer filter
    if (filters.customerIds && filters.customerIds.length > 0) {
      // Convert customer IDs to customer names for matching
      const selectedCustomerNames = filters.customerIds.map(customerId => 
        customers.find(cust => cust.id === customerId)?.name
      ).filter(Boolean);
      
      filtered = filtered.filter(invoice => 
        invoice.clientName && selectedCustomerNames.includes(invoice.clientName)
      );
    }
    
    // Apply due date filter
    if (filters.dueDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDueDate = new Date(invoice.dueDate);
        let matchesRange = true;
        
        if (filters.dueDate!.startDate) {
          matchesRange = matchesRange && invoiceDueDate >= filters.dueDate!.startDate;
        }
        
        if (filters.dueDate!.endDate) {
          matchesRange = matchesRange && invoiceDueDate <= filters.dueDate!.endDate;
        }
        
        return matchesRange;
      });
    }
    
    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        let comparison = 0;
        if (aValue > bValue) {
          comparison = 1;
        } else if (aValue < bValue) {
          comparison = -1;
        }
        
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    return {
      paginatedInvoices: paginatedData,
      totalFiltered: filtered.length
    };
  }, [invoices, filters, searchTerm, sortConfig, currentPage, itemsPerPage, categories, customers]);
  
  // Event handlers
  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedInvoices([]); // Clear selection when filters change
  };
  
  const handleResetFilters = () => {
    setFilters({ status: 'all' });
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedInvoices([]);
  };
  
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleRowAction = (action: 'view' | 'delete', invoice: Invoice) => {
    if (action === 'view') {
      // Navigate to invoice detail page
      console.log('Navigating to:', `/invoices/${invoice.id}`);
      router.push(`/invoices/${invoice.id}`);
    } else if (action === 'delete') {
      // Open delete confirmation modal
      setInvoiceToDelete(invoice);
      openDeleteModal();
    }
  };
  
  const handleDeleteConfirm = () => {
    // Refresh data after deletion
    loadData();
    setInvoiceToDelete(null);
    closeDeleteModal();
  };
  
  const handleDeleteCancel = () => {
    setInvoiceToDelete(null);
    closeDeleteModal();
  };
  
  // Extracted load data function for reuse
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const invoicesResult = await InvoiceService.getAllInvoices();
      
      if (invoicesResult.success && invoicesResult.data) {
        setInvoices(invoicesResult.data);
      } else {
        throw new Error(invoicesResult.error || 'Failed to load invoices');
      }
    } catch (err) {
      console.error('Error loading invoice data:', err);
      setError('Failed to load invoice data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(paginatedInvoices.map((invoice: Invoice) => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };
  
  const handleFilterClick = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };
  
  const handleExportClick = () => {
    console.log('Export button clicked');
    // This could trigger an export operation
  };

  return (
    <InvoiceErrorBoundary>
      <div className="space-y-6">
        <PageBreadcrumb 
          pageTitle="Invoices" 
          items={[
            { label: "Home", href: "/" },
            { label: "Invoices" }
          ]}
        />
        
        {/* Page Title and Description */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your most recent invoices list</p>
          </div>
          <a
            href="/invoices/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Invoice
          </a>
        </div>
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="ml-auto px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Metrics Dashboard */}
      {loading ? <InvoiceMetricsSkeleton /> : <InvoiceMetricsDashboard />}
      
      {/* Controls Bar */}
      {loading ? (
        <InvoiceControlsSkeleton />
      ) : (
        <InvoiceControlsBar
          activeFilters={filters}
          onFiltersChange={handleFiltersChange}
          onResetFilters={handleResetFilters}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onFilterClick={handleFilterClick}
          onExportClick={handleExportClick}
          customers={customers}
          categories={categories}
          loading={loading}
          totalResults={invoices.length}
          filteredResults={totalFiltered}
          showFilterDropdown={showFilterDropdown}
          onCloseFilterDropdown={() => setShowFilterDropdown(false)}
        />
      )}
      
      {/* Data Table */}
      {loading ? (
        <InvoiceTableSkeleton />
      ) : (
        <InvoiceDataTable
          invoices={paginatedInvoices}
          loading={loading}
          sortConfig={sortConfig}
          onSort={handleSort}
          onRowAction={handleRowAction}
          selectedInvoices={selectedInvoices}
          onSelectInvoice={handleSelectInvoice}
          onSelectAll={handleSelectAll}
        />
      )}
      
      {/* Pagination */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>per page</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {Math.ceil(totalFiltered / itemsPerPage)}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalFiltered / itemsPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(totalFiltered / itemsPerPage)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Invoice Modal */}
      {invoiceToDelete && (
        <InvoiceDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteCancel}
          invoice={invoiceToDelete}
          onInvoiceUpdate={handleDeleteConfirm}
        />
      )}
      </div>
    </InvoiceErrorBoundary>
  );
}