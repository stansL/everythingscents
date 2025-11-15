"use client";

import React, { useState, useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils/formatters';

interface InvoiceSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  disabled?: boolean;
}

export const InvoiceSearchField: React.FC<InvoiceSearchFieldProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = '',
  debounceMs = 300,
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create debounced function
  const debouncedOnChange = useRef(
    debounce((...args: unknown[]) => {
      const searchValue = args[0] as string;
      onChange(searchValue);
    }, debounceMs)
  ).current;

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  // Clear search
  const clearSearch = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          className={`w-4 h-4 transition-colors ${
            isFocused 
              ? 'text-blue-500' 
              : 'text-gray-400 dark:text-gray-500'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-10 py-2.5 text-sm
          border border-gray-300 dark:border-gray-600 
          rounded-lg
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400
          transition-all duration-200
          ${isFocused 
            ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-500 dark:border-blue-500' 
            : 'hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' 
            : 'focus:outline-none'
          }
        `}
        aria-label="Search invoices"
      />

      {/* Clear Button */}
      {localValue && !disabled && (
        <button
          onClick={clearSearch}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Clear search"
          tabIndex={-1}
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}

      {/* Loading indicator (optional) */}
      {disabled && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
    </div>
  );
};

// Compact version for smaller spaces
export const CompactSearchField: React.FC<InvoiceSearchFieldProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = '',
  debounceMs = 300,
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  const debouncedOnChange = useRef(
    debounce((...args: unknown[]) => {
      const searchValue = args[0] as string;
      onChange(searchValue);
    }, debounceMs)
  ).current;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default InvoiceSearchField;