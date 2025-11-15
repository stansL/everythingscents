"use client";

import React, { useState } from 'react';

interface InvoiceActionButtonsProps {
  onFilterClick: () => void;
  onExportClick: () => void;
  isFilterActive?: boolean;
  isExporting?: boolean;
  disabled?: boolean;
  className?: string;
}

export const InvoiceActionButtons: React.FC<InvoiceActionButtonsProps> = ({
  onFilterClick,
  onExportClick,
  isFilterActive = false,
  isExporting = false,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Filter Button */}
      <button
        onClick={onFilterClick}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg
          border transition-all duration-200
          ${isFilterActive
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
          }
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        `}
        aria-label={isFilterActive ? 'Close filters' : 'Open filters'}
        aria-pressed={isFilterActive}
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" 
          />
        </svg>
        <span>Filter</span>
        {isFilterActive && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </button>

      {/* Export Button */}
      <button
        onClick={onExportClick}
        disabled={disabled || isExporting}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg
          border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 
          text-gray-700 dark:text-gray-300
          transition-all duration-200
          ${disabled || isExporting
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        `}
        aria-label="Export invoices"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <span>Export</span>
          </>
        )}
      </button>
    </div>
  );
};

// Alternative compact version
export const CompactActionButtons: React.FC<InvoiceActionButtonsProps> = ({
  onFilterClick,
  onExportClick,
  isFilterActive = false,
  isExporting = false,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={onFilterClick}
        disabled={disabled}
        className={`p-2 rounded-md border transition-colors ${
          isFilterActive
            ? 'bg-blue-50 border-blue-200 text-blue-600'
            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
        title="Filter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
        </svg>
      </button>

      <button
        onClick={onExportClick}
        disabled={disabled || isExporting}
        className="p-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Export"
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

// Export dropdown component (for future use)
export const ExportDropdown: React.FC<{
  onExportCSV: () => void;
  onExportPDF: () => void;
  isExporting?: boolean;
}> = ({ onExportCSV, onExportPDF, isExporting = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  onExportCSV();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as CSV
              </button>
              <button
                onClick={() => {
                  onExportPDF();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export as PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceActionButtons;