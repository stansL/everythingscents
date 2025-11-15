"use client";

import React from 'react';

interface FilterButton {
  key: 'all' | 'paid' | 'unpaid' | 'draft';
  label: string;
  count?: number;
}

interface InvoiceFilterButtonsProps {
  activeFilter: 'all' | 'paid' | 'unpaid' | 'draft';
  onFilterChange: (filter: 'all' | 'paid' | 'unpaid' | 'draft') => void;
  invoiceCounts?: {
    all: number;
    paid: number;
    unpaid: number;
    draft: number;
  };
  className?: string;
}

export const InvoiceFilterButtons: React.FC<InvoiceFilterButtonsProps> = ({
  activeFilter,
  onFilterChange,
  invoiceCounts,
  className = ''
}) => {
  const filterButtons: FilterButton[] = [
    {
      key: 'all',
      label: 'All Invoices',
      count: invoiceCounts?.all
    },
    {
      key: 'unpaid',
      label: 'Unpaid',
      count: invoiceCounts?.unpaid
    },
    {
      key: 'draft',
      label: 'Draft',
      count: invoiceCounts?.draft
    }
  ];



  const getCountBadgeStyles = (isActive: boolean) => {
    const baseStyles = "inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full min-w-[20px]";
    
    if (isActive) {
      return `${baseStyles} bg-white text-blue-600`;
    }
    
    return `${baseStyles} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`;
  };

  return (
    <div className={`inline-flex rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {filterButtons.map((button, index) => {
        const isActive = activeFilter === button.key;
        const isFirst = index === 0;
        const isLast = index === filterButtons.length - 1;
        
        let buttonClasses = "px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap relative";
        
        // Add background and text colors
        if (isActive) {
          buttonClasses += " bg-blue-600 text-white z-10";
        } else {
          buttonClasses += " bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";
        }
        
        // Add borders and rounded corners
        if (isFirst) {
          buttonClasses += " rounded-l-lg border-r border-gray-200 dark:border-gray-700";
        } else if (isLast) {
          buttonClasses += " rounded-r-lg";
        } else {
          buttonClasses += " border-r border-gray-200 dark:border-gray-700";
        }
        
        // Handle active button borders
        if (isActive) {
          buttonClasses += " border-blue-600";
        }
        
        return (
          <button
            key={button.key}
            onClick={() => onFilterChange(button.key)}
            className={buttonClasses}
            aria-pressed={isActive}
            aria-label={`Filter by ${button.label}${button.count ? ` (${button.count} invoices)` : ''}`}
          >
            <span>{button.label}</span>
            {button.count !== undefined && (
              <span className={getCountBadgeStyles(isActive)}>
                {button.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Alternative minimal version without counts
export const SimpleInvoiceFilterButtons: React.FC<Omit<InvoiceFilterButtonsProps, 'invoiceCounts'>> = ({
  activeFilter,
  onFilterChange,
  className = ''
}) => {
  const filterButtons = [
    { key: 'all' as const, label: 'All Invoices' },
    { key: 'unpaid' as const, label: 'Unpaid' },
    { key: 'draft' as const, label: 'Draft' }
  ];

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {filterButtons.map((button) => {
        const isActive = activeFilter === button.key;
        
        return (
          <button
            key={button.key}
            onClick={() => onFilterChange(button.key)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
};

export default InvoiceFilterButtons;