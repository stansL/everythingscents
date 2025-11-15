/**
 * Loading skeleton components for better UX during data loading
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '20px',
  rounded = false 
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading content"
    />
  );
};

export const InvoiceTableSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Skeleton width="120px" height="24px" />
          <Skeleton width="80px" height="24px" />
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton width="24px" height="24px" />
                <div className="space-y-2">
                  <Skeleton width="120px" height="16px" />
                  <Skeleton width="90px" height="14px" />
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <Skeleton width="80px" height="16px" />
                <Skeleton width="100px" height="16px" />
                <Skeleton width="70px" height="16px" />
                <Skeleton width="60px" height="20px" rounded />
                <Skeleton width="80px" height="16px" />
                <Skeleton width="32px" height="32px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InvoiceMetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton width="32px" height="32px" rounded />
              <Skeleton width="40px" height="20px" />
            </div>
            <div className="space-y-2">
              <Skeleton width="100px" height="24px" />
              <Skeleton width="80px" height="16px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const InvoiceControlsSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} width="80px" height="36px" />
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search and actions */}
          <Skeleton width="250px" height="36px" />
          <Skeleton width="100px" height="36px" />
          <Skeleton width="32px" height="36px" />
        </div>
      </div>
    </div>
  );
};