import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierService } from '@/lib/services/inventory/supplierService';
import { Supplier } from '@/lib/services/products/types';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';

interface SuppliersListProps {
  className?: string;
  onSupplierSelect?: (supplier: Supplier) => void;
  selectionMode?: boolean;
}

export const SuppliersList: React.FC<SuppliersListProps> = ({
  className = '',
  onSupplierSelect,
  selectionMode = false
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  
  const router = useRouter();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await SupplierService.getAllSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data);
      } else {
        setError(response.error || 'Failed to load suppliers');
      }
    } catch (err) {
      setError('An error occurred while loading suppliers');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    router.push('/inventory/suppliers/add');
  };

  const handleEditSupplier = (supplier: Supplier) => {
    router.push(`/inventory/suppliers/edit/${supplier.id}`);
  };

  const handleCloseModal = () => {
    setSelectedSupplier(null);
    closeDeleteModal();
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier || !selectedSupplier.id) return;

    setDeleteLoading(true);
    setError('');

    try {
      const response = await SupplierService.deleteSupplier(selectedSupplier.id);
      if (response.success) {
        setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id));
        setSelectedSupplier(null);
        closeDeleteModal();
      } else {
        setError(response.error || 'Failed to delete supplier');
      }
    } catch (err) {
      setError('An error occurred while deleting supplier');
      console.error('Error deleting supplier:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page
  };

  const formatPaymentTerms = (terms: string) => {
    switch (terms) {
      case 'NET_30': return 'Net 30 Days';
      case 'NET_15': return 'Net 15 Days';
      case 'NET_10': return 'Net 10 Days';
      case 'COD': return 'Cash on Delivery';
      case 'PREPAID': return 'Prepaid';
      case 'NET_60': return 'Net 60 Days';
      case '2_10_NET_30': return '2/10 Net 30';
      default: return terms || 'Not specified';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Suppliers ({suppliers.length})
            </h3>
            {!selectionMode && (
              <button
                onClick={handleAddSupplier}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Supplier
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers by name, code, or email..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Suppliers List */}
        <div>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No suppliers found' : 'No suppliers yet'}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Add your first supplier to start managing your inventory.'
                }
              </p>
              {!searchTerm && !selectionMode && (
                <button
                  onClick={handleAddSupplier}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Supplier
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectionMode ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => selectionMode && onSupplierSelect?.(supplier)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {supplier.name}
                        </h4>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                          {supplier.code}
                        </span>
                        {!supplier.isActive && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Contact:</span>
                          <div>{supplier.contactInfo?.email || 'No email'}</div>
                          <div>{supplier.contactInfo?.phone || 'No phone'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>
                          <div>
                            {supplier.contactInfo?.address ? 
                              `${supplier.contactInfo.address.city || ''}, ${supplier.contactInfo.address.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Address not provided'
                              : 'No address'
                            }
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Payment Terms:</span>
                          <div>{formatPaymentTerms(supplier.paymentTerms || '')}</div>
                        </div>
                      </div>
                      
                      {supplier.notes && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                          {supplier.notes}
                        </div>
                      )}
                    </div>
                    
                    {!selectionMode && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit supplier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            openDeleteModal();
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete supplier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
            </div>

            {/* Pagination info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} suppliers
            </div>

            {/* Pagination buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const isCurrentPage = page === currentPage;
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage && page === 2 && currentPage > 4) {
                    return <span key="dots1" className="px-2 text-gray-400">...</span>;
                  }
                  if (!showPage && page === totalPages - 1 && currentPage < totalPages - 3) {
                    return <span key="dots2" className="px-2 text-gray-400">...</span>;
                  }
                  if (!showPage) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Supplier Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  Delete Supplier
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-2 pb-3">
            {error && (
              <div className="mb-4 p-3 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {selectedSupplier && (
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{selectedSupplier.name}</span>? 
                  This will also affect any associated purchase orders and transactions.
                </p>
                
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    {selectedSupplier.name}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Code: {selectedSupplier.code}
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Contact: {selectedSupplier.contactInfo?.email || 'No email'}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleDeleteSupplier}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
            >
              {deleteLoading ? "Deleting..." : "Delete Supplier"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};