import React, { useState, useEffect } from 'react';
import { SupplierService } from '@/lib/services/inventory/supplierService';
import { Supplier } from '@/lib/services/products/types';
import { SupplierForm } from './SupplierForm';
import { useModal } from '@/hooks/useModal';

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
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

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

  const handleSupplierCreated = (supplier: Supplier) => {
    setSuppliers(prev => [supplier, ...prev]);
    createModal.closeModal();
  };

  const handleSupplierUpdated = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    setSelectedSupplier(null);
    editModal.closeModal();
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await SupplierService.deleteSupplier(selectedSupplier.id);
      if (response.success) {
        setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id));
        setSelectedSupplier(null);
        deleteModal.closeModal();
      } else {
        setError(response.error || 'Failed to delete supplier');
      }
    } catch (err) {
      setError('An error occurred while deleting supplier');
      console.error('Error deleting supplier:', err);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                onClick={createModal.openModal}
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
        <div className="max-h-96 overflow-y-auto">
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
                  onClick={createModal.openModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Supplier
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSuppliers.map((supplier) => (
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
                        {supplier.status === 'inactive' && (
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
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            editModal.open();
                          }}
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
                            deleteModal.open();
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
      </div>

      {/* Create Supplier Modal */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <SupplierForm
              onSuccess={handleSupplierCreated}
              onCancel={createModal.close}
            />
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editModal.isOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <SupplierForm
              supplier={selectedSupplier}
              onSuccess={handleSupplierUpdated}
              onCancel={() => {
                setSelectedSupplier(null);
                editModal.close();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Supplier</h3>
                <p className="text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-medium">{selectedSupplier.name}</span>? 
              This will also affect any associated purchase orders and transactions.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedSupplier(null);
                  deleteModal.close();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSupplier}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};