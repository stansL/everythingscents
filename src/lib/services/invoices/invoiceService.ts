import { 
  Invoice, 
  InvoiceMetrics, 
  Customer, 
  Category, 
  FilterOptions, 
  ServiceResponse, 
  SortOptions, 
  PaginationOptions,
  InvoiceFormData 
} from './types';

import { 
  mockInvoices, 
  mockCustomers, 
  mockCategories, 
  generateMockMetrics,
  generateMockInvoices,
  searchInvoices,
  getInvoiceStats
} from './mockData';

import { FirestoreService } from '../../firebase/firestore';

// Constants
const COLLECTION_NAME = 'invoices';

// Simulate async operations with delays
const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export class InvoiceService {
  private static invoices: Invoice[] = [...generateMockInvoices(30)];
  
  // Get all invoices
  static async getAllInvoices(): Promise<ServiceResponse<Invoice[]>> {
    try {
      await simulateDelay(300);
      return {
        success: true,
        data: [...this.invoices],
        message: 'Invoices retrieved successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve invoices'
      };
    }
  }

  // Get paginated invoices
  static async getPaginatedInvoices(
    pagination: PaginationOptions,
    filters?: FilterOptions,
    sort?: SortOptions
  ): Promise<ServiceResponse<{ invoices: Invoice[], total: number }>> {
    try {
      await simulateDelay(200);
      
      let filteredInvoices = [...this.invoices];
      
      // Apply filters
      if (filters) {
        filteredInvoices = this.applyFilters(filteredInvoices, filters);
      }
      
      // Apply sorting
      if (sort) {
        filteredInvoices = this.applySorting(filteredInvoices, sort);
      }
      
      const total = filteredInvoices.length;
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          invoices: paginatedInvoices,
          total
        },
        message: 'Paginated invoices retrieved successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve paginated invoices'
      };
    }
  }

  // Get invoice by ID
  static async getInvoiceById(id: string): Promise<ServiceResponse<Invoice>> {
    try {
      await simulateDelay(200);
      const invoice = this.invoices.find(inv => inv.id === id);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }
      
      return {
        success: true,
        data: invoice,
        message: 'Invoice retrieved successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve invoice'
      };
    }
  }

  // Create new invoice
  static async createInvoice(invoiceData: InvoiceFormData): Promise<ServiceResponse<Invoice>> {
    try {
      await simulateDelay(400);
      
      const newInvoice: Invoice = {
        id: `#${Date.now()}`, // Simple ID generation
        clientName: invoiceData.clientName,
        clientEmail: invoiceData.clientEmail,
        issueDate: new Date(),
        dueDate: invoiceData.dueDate,
        amount: Math.round(invoiceData.amount * 100), // Convert to cents
        status: invoiceData.status,
        category: invoiceData.category,
        description: invoiceData.description,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.invoices.unshift(newInvoice); // Add to beginning
      
      return {
        success: true,
        data: newInvoice,
        message: 'Invoice created successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to create invoice'
      };
    }
  }

  // Update invoice
  static async updateInvoice(id: string, updates: Partial<InvoiceFormData>): Promise<ServiceResponse<Invoice>> {
    try {
      await simulateDelay(400);
      
      const invoiceIndex = this.invoices.findIndex(inv => inv.id === id);
      if (invoiceIndex === -1) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }
      
      const updatedInvoice = {
        ...this.invoices[invoiceIndex],
        ...updates,
        amount: updates.amount ? Math.round(updates.amount * 100) : this.invoices[invoiceIndex].amount,
        updatedAt: new Date()
      };
      
      this.invoices[invoiceIndex] = updatedInvoice;
      
      return {
        success: true,
        data: updatedInvoice,
        message: 'Invoice updated successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to update invoice'
      };
    }
  }

  // Delete invoice
  static async deleteInvoice(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // Try to delete from Firebase first
      try {
        const success = await FirestoreService.delete(COLLECTION_NAME, id);
        if (success) {
          // Also remove from local cache
          const invoiceIndex = this.invoices.findIndex(inv => inv.id === id);
          if (invoiceIndex !== -1) {
            this.invoices.splice(invoiceIndex, 1);
          }
          
          return {
            success: true,
            data: true,
            message: 'Invoice deleted successfully'
          };
        }
      } catch (firebaseError) {
        console.warn('Firebase delete failed, falling back to mock data:', firebaseError);
      }
      
      // Fallback to mock data deletion
      await simulateDelay(300);
      
      const invoiceIndex = this.invoices.findIndex(inv => inv.id === id);
      if (invoiceIndex === -1) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }
      
      this.invoices.splice(invoiceIndex, 1);
      
      return {
        success: true,
        data: true,
        message: 'Invoice deleted successfully'
      };
    } catch (error) {
      console.error('Delete invoice error:', error);
      return {
        success: false,
        error: 'Failed to delete invoice'
      };
    }
  }

  // Get invoice metrics
  static async getInvoiceMetrics(): Promise<ServiceResponse<InvoiceMetrics>> {
    try {
      await simulateDelay(200);
      const metrics = generateMockMetrics(this.invoices);
      
      return {
        success: true,
        data: metrics,
        message: 'Metrics retrieved successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve metrics'
      };
    }
  }

  // Get customers
  static async getCustomers(): Promise<ServiceResponse<Customer[]>> {
    try {
      await simulateDelay(200);
      return {
        success: true,
        data: [...mockCustomers],
        message: 'Customers retrieved successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve customers'
      };
    }
  }

  // Get categories
  static async getCategories(): Promise<ServiceResponse<Category[]>> {
    try {
      await simulateDelay(200);
      return {
        success: true,
        data: [...mockCategories],
        message: 'Categories retrieved successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve categories'
      };
    }
  }

  // Apply filters to invoice array
  private static applyFilters(invoices: Invoice[], filters: FilterOptions): Invoice[] {
    let filtered = [...invoices];
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }
    
    // Search term filter
    if (filters.searchTerm) {
      filtered = searchInvoices(filtered, filters.searchTerm);
    }
    
    // Category filter
    if (filters.category) {
      filtered = filtered.filter(inv => 
        inv.category?.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    // Customer filter
    if (filters.customer) {
      filtered = filtered.filter(inv => 
        inv.clientName.toLowerCase().includes(filters.customer!.toLowerCase()) ||
        inv.clientEmail?.toLowerCase().includes(filters.customer!.toLowerCase())
      );
    }
    
    // Date range filter
    if (filters.dueDate?.startDate && filters.dueDate?.endDate) {
      filtered = filtered.filter(inv => 
        inv.dueDate >= filters.dueDate!.startDate! &&
        inv.dueDate <= filters.dueDate!.endDate!
      );
    }
    
    // Amount range filter
    if (filters.amountRange?.min !== undefined || filters.amountRange?.max !== undefined) {
      filtered = filtered.filter(inv => {
        const amount = inv.amount / 100; // Convert from cents
        const min = filters.amountRange?.min ?? 0;
        const max = filters.amountRange?.max ?? Infinity;
        return amount >= min && amount <= max;
      });
    }
    
    return filtered;
  }

  // Apply sorting to invoice array
  private static applySorting(invoices: Invoice[], sort: SortOptions): Invoice[] {
    return [...invoices].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      let comparison = 0;
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) {
        comparison = 0;
      } else if (aValue === undefined) {
        comparison = 1;
      } else if (bValue === undefined) {
        comparison = -1;
      } else if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  // Export invoices to CSV
  static async exportInvoicesCSV(invoices?: Invoice[]): Promise<ServiceResponse<string>> {
    try {
      await simulateDelay(800);
      
      const dataToExport = invoices || this.invoices;
      
      const headers = ['ID', 'Client Name', 'Email', 'Issue Date', 'Due Date', 'Amount', 'Status', 'Category'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(inv => [
          inv.id,
          `"${inv.clientName}"`,
          inv.clientEmail || '',
          inv.issueDate.toLocaleDateString(),
          inv.dueDate.toLocaleDateString(),
          (inv.amount / 100).toFixed(2),
          inv.status,
          inv.category || ''
        ].join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `invoices-${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return {
        success: true,
        data: 'CSV export completed',
        message: 'Invoices exported successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to export invoices'
      };
    }
  }

  // Get invoice statistics
  static getInvoiceStatistics() {
    return getInvoiceStats();
  }

  // Search customers for dropdown
  static async searchCustomers(searchTerm: string): Promise<ServiceResponse<Customer[]>> {
    try {
      await simulateDelay(150);
      
      if (!searchTerm.trim()) {
        return {
          success: true,
          data: mockCustomers.slice(0, 10), // Return first 10 if no search
          message: 'Customers retrieved successfully'
        };
      }
      
      const filtered = mockCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return {
        success: true,
        data: filtered.slice(0, 10), // Limit to 10 results
        message: 'Customers filtered successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to search customers'
      };
    }
  }

  // Search categories for dropdown
  static async searchCategories(searchTerm: string): Promise<ServiceResponse<Category[]>> {
    try {
      await simulateDelay(150);
      
      if (!searchTerm.trim()) {
        return {
          success: true,
          data: mockCategories,
          message: 'Categories retrieved successfully'
        };
      }
      
      const filtered = mockCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return {
        success: true,
        data: filtered,
        message: 'Categories filtered successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to search categories'
      };
    }
  }

  // Record a payment for an invoice (Phase 1)
  static async recordPayment(
    invoiceId: string,
    payment: Omit<import('./types').Payment, 'id'>
  ): Promise<ServiceResponse<Invoice>> {
    try {
      await simulateDelay(300);
      
      const invoiceIndex = this.invoices.findIndex(inv => inv.id === invoiceId);
      if (invoiceIndex === -1) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      const invoice = this.invoices[invoiceIndex];
      
      // Generate payment ID
      const newPayment: import('./types').Payment = {
        ...payment,
        id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      // Add payment to invoice
      const updatedPayments = [...(invoice.payments || []), newPayment];
      
      // Calculate total paid
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Update workflow status based on payment
      let newWorkflowStatus = invoice.workflowStatus;
      if (totalPaid >= invoice.amount) {
        newWorkflowStatus = 'paid' as import('./types').WorkflowStatus;
      } else if (totalPaid > 0) {
        newWorkflowStatus = 'partially_paid' as import('./types').WorkflowStatus;
      }

      // Update invoice
      this.invoices[invoiceIndex] = {
        ...invoice,
        payments: updatedPayments,
        workflowStatus: newWorkflowStatus,
        updatedAt: new Date(),
      };

      return {
        success: true,
        data: this.invoices[invoiceIndex],
        message: 'Payment recorded successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to record payment'
      };
    }
  }

  // Update workflow status for an invoice (Phase 1)
  static async updateWorkflowStatus(
    invoiceId: string,
    workflowStatus: import('./types').WorkflowStatus
  ): Promise<ServiceResponse<Invoice>> {
    try {
      await simulateDelay(200);
      
      const invoiceIndex = this.invoices.findIndex(inv => inv.id === invoiceId);
      if (invoiceIndex === -1) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      // Update invoice workflow status
      this.invoices[invoiceIndex] = {
        ...this.invoices[invoiceIndex],
        workflowStatus,
        updatedAt: new Date(),
      };

      return {
        success: true,
        data: this.invoices[invoiceIndex],
        message: 'Workflow status updated successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to update workflow status'
      };
    }
  }

  // Update delivery information for an invoice (Phase 1)
  static async updateDeliveryInfo(
    invoiceId: string,
    deliveryInfo: import('./types').DeliveryInfo
  ): Promise<ServiceResponse<Invoice>> {
    try {
      await simulateDelay(200);
      
      const invoiceIndex = this.invoices.findIndex(inv => inv.id === invoiceId);
      if (invoiceIndex === -1) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      // Update invoice delivery info
      this.invoices[invoiceIndex] = {
        ...this.invoices[invoiceIndex],
        deliveryInfo,
        updatedAt: new Date(),
      };

      return {
        success: true,
        data: this.invoices[invoiceIndex],
        message: 'Delivery information updated successfully'
      };
    } catch {
      return {
        success: false,
        error: 'Failed to update delivery information'
      };
    }
  }
}
