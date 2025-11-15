'use client';

import React, { memo } from 'react';
import { 
  InvoiceFilterButtons, 
  InvoiceSearchField, 
  InvoiceActionButtons,
  InvoiceFilterDropdown 
} from './';
import { FilterOptions, Customer, Category } from '@/lib/services/invoices/types';

interface InvoiceControlsBarProps {
  // Filter props
  activeFilters: Partial<FilterOptions>;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onResetFilters: () => void;
  
  // Search props
  searchTerm: string;
  onSearchChange: (term: string) => void;
  
  // Action props
  onFilterClick: () => void;
  onExportClick: () => void;
  
  // Filter dropdown data
  customers: Customer[];
  categories: Category[];
  
  // Loading states
  loading?: boolean;
  
  // Results info
  totalResults?: number;
  filteredResults?: number;
  
  // Responsive behavior
  compact?: boolean;
  
  // Filter dropdown state
  showFilterDropdown?: boolean;
  onCloseFilterDropdown?: () => void;
}

export const InvoiceControlsBar: React.FC<InvoiceControlsBarProps> = memo(({
  activeFilters,
  onFiltersChange,
  onResetFilters,
  searchTerm,
  onSearchChange,
  onFilterClick,
  onExportClick,
  customers,
  categories,
  loading = false,
  totalResults = 0,
  filteredResults = 0,
  compact = false,
  showFilterDropdown = false,
  onCloseFilterDropdown
}) => {
  const handleFilterButtonClick = (filter: 'all' | 'paid' | 'unpaid' | 'draft') => {
    // Apply the status filter
    onFiltersChange({ ...activeFilters, status: filter });
  };



  const handleApplyAdvancedFilters = (filters: Partial<FilterOptions>) => {
    onFiltersChange({ ...activeFilters, ...filters });
  };

  const hasActiveAdvancedFilters = () => {
    return !!(
      activeFilters.dueDate?.startDate ||
      activeFilters.dueDate?.endDate ||
      activeFilters.categoryIds?.length ||
      activeFilters.customerIds?.length ||
      activeFilters.amountRange?.min ||
      activeFilters.amountRange?.max
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.status && activeFilters.status !== 'all') count++;
    if (activeFilters.dueDate?.startDate || activeFilters.dueDate?.endDate) count++;
    if (activeFilters.categoryIds?.length) count += activeFilters.categoryIds.length;
    if (activeFilters.customerIds?.length) count += activeFilters.customerIds.length;
    if (activeFilters.amountRange?.min || activeFilters.amountRange?.max) count++;
    return count;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
        {/* Main Controls Row */}
        <div className={`py-4 transition-all duration-300 ${compact ? 'space-y-3' : 'flex flex-wrap items-center justify-between gap-4'}`}>          {/* Left Side - Filters and Search */}
          <div className={`${compact ? 'space-y-3' : 'flex flex-wrap items-center gap-4'}`}>
            
            {/* Filter Buttons */}
            <div>
              <InvoiceFilterButtons
                activeFilter={activeFilters.status || 'all'}
                onFilterChange={handleFilterButtonClick}
              />
            </div>

            {/* Search Field */}
            <div className={`${compact ? 'w-full' : 'min-w-64'}`}>
              <InvoiceSearchField
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search invoices, customers..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className={`${compact ? 'flex justify-between items-center' : 'flex items-center gap-3'}`}>
            
            {/* Results Summary */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              ) : (
                <span>
                  {filteredResults !== totalResults ? (
                    `${filteredResults} of ${totalResults} results`
                  ) : (
                    `${totalResults} ${totalResults === 1 ? 'result' : 'results'}`
                  )}
                </span>
              )}
            </div>

            {/* Action Buttons with Dropdown */}
            <div className="relative">
              <InvoiceActionButtons
                onFilterClick={onFilterClick}
                onExportClick={onExportClick}
                isFilterActive={hasActiveAdvancedFilters()}
                disabled={loading}
              />
              
              {/* Advanced Filter Dropdown */}
              <InvoiceFilterDropdown
                isOpen={showFilterDropdown}
                onClose={() => onCloseFilterDropdown?.()}
                onApplyFilters={handleApplyAdvancedFilters}
                customers={customers}
                categories={categories}
                currentFilters={activeFilters}
              />
            </div>
          </div>
        </div>

        {/* Active Filters Row */}
        {(searchTerm || getActiveFiltersCount() > 0) && (
          <div className="pb-4 flex flex-wrap items-center gap-2">
            
            {/* Search Term Chip */}
            {searchTerm && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                           bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                <span>Search: &ldquo;{searchTerm}&rdquo;</span>
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-2 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </div>
            )}

            {/* Status Filter Chip */}
            {activeFilters.status && activeFilters.status !== 'all' && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                           bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                <span>Status: {activeFilters.status}</span>
                <button
                  onClick={() => onFiltersChange({ ...activeFilters, status: 'all' })}
                  className="ml-2 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            )}

            {/* Category Filters */}
            {activeFilters.categoryIds?.map((categoryId) => {
              const category = categories.find(c => c.id === categoryId);
              return category ? (
                <div key={categoryId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                             bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                  <span>Category: {category.name}</span>
                  <button
                    onClick={() => {
                      const newCategoryIds = activeFilters.categoryIds?.filter(id => id !== categoryId);
                      onFiltersChange({ 
                        ...activeFilters, 
                        categoryIds: newCategoryIds?.length ? newCategoryIds : undefined 
                      });
                    }}
                    className="ml-2 hover:text-purple-600 dark:hover:text-purple-300"
                  >
                    ×
                  </button>
                </div>
              ) : null;
            })}

            {/* Customer Filters */}
            {activeFilters.customerIds?.map((customerId) => {
              const customer = customers.find(c => c.id === customerId);
              return customer ? (
                <div key={customerId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                             bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                  <span>Customer: {customer.name}</span>
                  <button
                    onClick={() => {
                      const newCustomerIds = activeFilters.customerIds?.filter(id => id !== customerId);
                      onFiltersChange({ 
                        ...activeFilters, 
                        customerIds: newCustomerIds?.length ? newCustomerIds : undefined 
                      });
                    }}
                    className="ml-2 hover:text-green-600 dark:hover:text-green-300"
                  >
                    ×
                  </button>
                </div>
              ) : null;
            })}

            {/* Clear All Button */}
            {(searchTerm || getActiveFiltersCount() > 0) && (
              <button
                onClick={() => {
                  onSearchChange('');
                  onResetFilters();
                }}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 
                         hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

InvoiceControlsBar.displayName = 'InvoiceControlsBar';