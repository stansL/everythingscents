"use client";

import React, { useEffect, useState, memo } from 'react';
import { InvoiceMetrics } from '@/lib/services/invoices/types';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { formatAmountFromCents } from '@/lib/utils/formatters';

interface InvoiceMetricsProps {
  className?: string;
}

export const InvoiceMetricsDashboard: React.FC<InvoiceMetricsProps> = memo(({ 
  className = '' 
}) => {
  const [metrics, setMetrics] = useState<InvoiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await InvoiceService.getInvoiceMetrics();
      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to load metrics');
      }
    } catch (err) {
      setError('An error occurred while loading metrics');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mb-8 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Failed to load metrics: {error}
          </p>
          <button
            onClick={loadMetrics}
            className="mt-2 text-red-600 dark:text-red-400 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const metricCards = [
    {
      title: 'Due within next 30 days',
      value: formatAmountFromCents(metrics.dueWithin30Days * 100),
      description: 'Overdue invoices requiring attention',
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trend: null,
      valueColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    {
      title: 'Average time to get paid',
      value: `${metrics.averagePaymentTime.toFixed(1)} days`,
      description: 'Average collection period',
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trend: null,
      valueColor: 'text-gray-900 dark:text-white',
      bgColor: 'bg-white dark:bg-gray-900',
      borderColor: 'border-gray-200 dark:border-gray-700'
    },
    {
      title: 'Upcoming Payout',
      value: `${metrics.upcomingPayoutDays} days`,
      description: 'Next scheduled payout',
      icon: (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      trend: null,
      valueColor: 'text-gray-900 dark:text-white',
      bgColor: 'bg-white dark:bg-gray-900',
      borderColor: 'border-gray-200 dark:border-gray-700'
    },
    {
      title: 'Total Outstanding',
      value: formatAmountFromCents(metrics.totalOutstanding * 100),
      description: 'Unpaid invoice balance',
      icon: (
        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      trend: null,
      valueColor: 'text-gray-900 dark:text-white',
      bgColor: 'bg-white dark:bg-gray-900',
      borderColor: 'border-gray-200 dark:border-gray-700'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 ${className}`}>
      {metricCards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-xl border ${card.borderColor} p-4 transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600`}
        >
          {/* Two Column Layout */}
          <div className="flex items-start justify-between">
            {/* Left Column - Text Content */}
            <div className="flex-1 pr-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {card.description}
              </p>
            </div>
            
            {/* Right Column - Icon and Value */}
            <div className="flex flex-col items-end space-y-2">
              <div className="flex-shrink-0">
                {card.icon}
              </div>
              <div className={`text-2xl font-bold ${card.valueColor} transition-colors text-right`}>
                {card.value}
              </div>
            </div>
          </div>

          {/* Trend Indicator Section */}
          {card.trend && (
            <div className="mt-3 flex justify-end">
              <div className="flex items-center">
                {card.trend === 'up' && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {card.trend === 'down' && (
                  <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {card.trend === 'stable' && (
                  <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

InvoiceMetricsDashboard.displayName = 'InvoiceMetricsDashboard';

export default InvoiceMetricsDashboard;