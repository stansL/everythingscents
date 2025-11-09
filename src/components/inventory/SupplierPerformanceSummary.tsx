"use client";

import React, { useState, useEffect } from 'react';
import { supplierPerformanceService, SupplierPerformanceMetrics } from '@/lib/services/inventory/supplierPerformanceService';

interface SupplierPerformanceSummaryProps {
  className?: string;
}

export const SupplierPerformanceSummary: React.FC<SupplierPerformanceSummaryProps> = ({ className = '' }) => {
  const [topPerformers, setTopPerformers] = useState<SupplierPerformanceMetrics[]>([]);
  const [bottomPerformers, setBottomPerformers] = useState<SupplierPerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTime, setRefreshTime] = useState<Date>(new Date());

  useEffect(() => {
    loadSupplierRankings();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      loadSupplierRankings();
      setRefreshTime(new Date());
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadSupplierRankings = async () => {
    try {
      setLoading(true);
      const rankings = await supplierPerformanceService.getSupplierRankings(3);
      setTopPerformers(rankings.topPerformers);
      setBottomPerformers(rankings.bottomPerformers);
    } catch (error) {
      console.error('Error loading supplier rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supplier Performance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Updated {refreshTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <a
            href="/inventory/reports"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            View All →
          </a>
        </div>
      </div>

      <div className="p-6">
        {topPerformers.length === 0 && bottomPerformers.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No Supplier Data</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add suppliers and purchase orders to track performance.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Performers */}
            {topPerformers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Top Performers</h4>
                </div>
                <div className="space-y-2">
                  {topPerformers.slice(0, 3).map((supplier, index) => (
                    <div key={supplier.supplierId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {supplier.supplierName.length > 20 
                              ? `${supplier.supplierName.substring(0, 20)}...` 
                              : supplier.supplierName
                            }
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {supplier.totalOrders} orders • {Math.round((supplier.onTimeDeliveries / supplier.completedOrders) * 100) || 0}% on-time
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(supplier.performanceScore)}`}>
                        {supplier.performanceScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Performers - Show only if there are more than 3 suppliers total */}
            {bottomPerformers.length > 0 && (topPerformers.length + bottomPerformers.length) > 3 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Needs Attention</h4>
                </div>
                <div className="space-y-2">
                  {bottomPerformers.slice(0, 2).map((supplier) => (
                    <div key={supplier.supplierId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {supplier.supplierName.length > 20 
                              ? `${supplier.supplierName.substring(0, 20)}...` 
                              : supplier.supplierName
                            }
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {supplier.totalOrders} orders • {Math.round((supplier.onTimeDeliveries / supplier.completedOrders) * 100) || 0}% on-time
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(supplier.performanceScore)}`}>
                        {supplier.performanceScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {topPerformers.length + bottomPerformers.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Suppliers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round([...topPerformers, ...bottomPerformers].reduce((sum, s) => sum + s.performanceScore, 0) / (topPerformers.length + bottomPerformers.length)) || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};