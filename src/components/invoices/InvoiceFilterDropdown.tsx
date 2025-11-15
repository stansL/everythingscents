'use client';

import React, { useState, memo, useEffect, useRef } from 'react';
import { ChevronDownIcon, CloseIcon } from '@/icons';
import { CustomDatePicker } from '@/components/form/CustomDatePicker';
import { FilterOptions, Customer, Category } from '@/lib/services/invoices/types';

interface InvoiceFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Partial<FilterOptions>) => void;
  customers: Customer[];
  categories: Category[];
  currentFilters: Partial<FilterOptions>;
}

export const InvoiceFilterDropdown: React.FC<InvoiceFilterDropdownProps> = memo(({
  isOpen,
  onClose,
  onApplyFilters,
  customers,
  categories,
  currentFilters
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localFilters, setLocalFilters] = useState<Partial<FilterOptions>>(currentFilters);
  const [customerSearch, setCustomerSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [dateErrors, setDateErrors] = useState<{ fromDate?: string; toDate?: string }>({});

  // Get today's date for validation
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  // Validate date range
  const validateDates = (fromDate?: Date, toDate?: Date) => {
    const errors: { fromDate?: string; toDate?: string } = {};
    
    if (fromDate && fromDate > today) {
      errors.fromDate = 'From date cannot be in the future';
    }
    
    if (toDate && toDate > today) {
      errors.toDate = 'To date cannot be in the future';
    }
    
    if (fromDate && toDate && fromDate > toDate) {
      errors.toDate = 'To date cannot be earlier than from date';
    }
    
    setDateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleApply = () => {
    // Validate dates before applying
    const isValid = validateDates(
      localFilters.dueDate?.startDate,
      localFilters.dueDate?.endDate
    );
    
    if (isValid) {
      onApplyFilters(localFilters);
      onClose();
    }
  };

  const handleReset = () => {
    const resetFilters: Partial<FilterOptions> = {
      status: 'all',
      dueDate: undefined,
      categoryIds: [],
      customerIds: []
    };
    setLocalFilters(resetFilters);
    setCustomerSearch('');
    setCategorySearch('');
    setDateErrors({});
    onApplyFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Filter Options
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
          {/* Due Date Range Section */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              DUE DATE RANGE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  From Date
                </label>
                <CustomDatePicker
                  selected={localFilters.dueDate?.startDate || null}
                  onChange={(date) => {
                    const newFilters = { 
                      ...localFilters, 
                      dueDate: { ...localFilters.dueDate, startDate: date || undefined }
                    };
                    setLocalFilters(newFilters);
                    validateDates(date || undefined, newFilters.dueDate?.endDate);
                  }}
                  placeholderText="From ..."
                  maxDate={Math.min(localFilters.dueDate?.endDate?.getTime() || today.getTime(), today.getTime())}
                />
                {dateErrors.fromDate && (
                  <p className="text-xs text-red-500 mt-1">{dateErrors.fromDate}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  To Date
                </label>
                <CustomDatePicker
                  selected={localFilters.dueDate?.endDate || null}
                  onChange={(date) => {
                    const newFilters = { 
                      ...localFilters, 
                      dueDate: { ...localFilters.dueDate, endDate: date || undefined }
                    };
                    setLocalFilters(newFilters);
                    validateDates(newFilters.dueDate?.startDate, date || undefined);
                  }}
                  placeholderText="To ..."
                  minDate={localFilters.dueDate?.startDate || undefined}
                  maxDate={today}
                />
                {dateErrors.toDate && (
                  <p className="text-xs text-red-500 mt-1">{dateErrors.toDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Category Section */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              CATEGORY
            </label>
            <div className="relative">
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start typing to search categories..."
              />
              <ChevronDownIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Category Options - Show only when searching or if categories are selected */}
            {(categorySearch.length > 0 || (localFilters.categoryIds && localFilters.categoryIds.length > 0)) && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {categorySearch.length > 0 ? (
                  // Show filtered results when searching
                  filteredCategories.length > 0 ? (
                    filteredCategories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <input
                          type="checkbox"
                          checked={localFilters.categoryIds?.includes(category.id) || false}
                          onChange={(e) => {
                            const categoryIds = localFilters.categoryIds || [];
                            if (e.target.checked) {
                              setLocalFilters(prev => ({
                                ...prev,
                                categoryIds: [...categoryIds, category.id]
                              }));
                            } else {
                              setLocalFilters(prev => ({
                                ...prev,
                                categoryIds: categoryIds.filter((id: string) => id !== category.id)
                              }));
                            }
                          }}
                          className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 rounded 
                                   focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {category.name}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                      No categories found
                    </div>
                  )
                ) : (
                  // Show selected categories when not searching
                  localFilters.categoryIds?.map(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    return category ? (
                      <label key={category.id} className="flex items-center space-x-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {
                            setLocalFilters(prev => ({
                              ...prev,
                              categoryIds: prev.categoryIds?.filter((id: string) => id !== category.id) || []
                            }));
                          }}
                          className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 rounded 
                                   focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          {category.name}
                        </span>
                      </label>
                    ) : null;
                  })
                )}
              </div>
            )}
          </div>

          {/* Customer Section */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              CUSTOMER
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start typing to search customers..."
              />
              <ChevronDownIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Customer Options - Show only when searching or if customers are selected */}
            {(customerSearch.length > 0 || (localFilters.customerIds && localFilters.customerIds.length > 0)) && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {customerSearch.length > 0 ? (
                  // Show filtered results when searching
                  filteredCustomers.length > 0 ? (
                    filteredCustomers.map(customer => (
                      <label key={customer.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <input
                          type="checkbox"
                          checked={localFilters.customerIds?.includes(customer.id) || false}
                          onChange={(e) => {
                            const customerIds = localFilters.customerIds || [];
                            if (e.target.checked) {
                              setLocalFilters(prev => ({
                                ...prev,
                                customerIds: [...customerIds, customer.id]
                              }));
                            } else {
                              setLocalFilters(prev => ({
                                ...prev,
                                customerIds: customerIds.filter((id: string) => id !== customer.id)
                              }));
                            }
                          }}
                          className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 rounded 
                                   focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {customer.name} - {customer.email}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                      No customers found
                    </div>
                  )
                ) : (
                  // Show selected customers when not searching
                  localFilters.customerIds?.map(customerId => {
                    const customer = customers.find(c => c.id === customerId);
                    return customer ? (
                      <label key={customer.id} className="flex items-center space-x-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => {
                            setLocalFilters(prev => ({
                              ...prev,
                              customerIds: prev.customerIds?.filter((id: string) => id !== customer.id) || []
                            }));
                          }}
                          className="w-3 h-3 text-blue-600 border-gray-300 dark:border-gray-600 rounded 
                                   focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          {customer.name} - {customer.email}
                        </span>
                      </label>
                    ) : null;
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium 
                     rounded-lg transition-colors focus:ring-2 focus:ring-blue-500"
          >
            Apply
          </button>
        </div>
      </div>
  );
});

InvoiceFilterDropdown.displayName = 'InvoiceFilterDropdown';