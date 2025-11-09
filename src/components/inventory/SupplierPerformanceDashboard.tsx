"use client";

import React, { useState, useEffect } from 'react';
import { supplierPerformanceService, SupplierPerformanceMetrics, SupplierTrend } from '@/lib/services/inventory/supplierPerformanceService';

interface SupplierPerformanceDashboardProps {
  className?: string;
}

export const SupplierPerformanceDashboard: React.FC<SupplierPerformanceDashboardProps> = ({ className = '' }) => {
  const [performanceData, setPerformanceData] = useState<SupplierPerformanceMetrics[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierPerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<SupplierTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last-90-days');

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'last-30-days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'last-90-days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'last-6-months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'last-year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 90);
      }
      
      const data = await supplierPerformanceService.getAllSuppliersPerformance({
        start: startDate,
        end: endDate
      });
      
      setPerformanceData(data);
      if (data.length > 0 && !selectedSupplier) {
        setSelectedSupplier(data[0]);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, [dateRange]);

  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierTrends(selectedSupplier.supplierId);
    }
  }, [selectedSupplier]);

  const loadSupplierTrends = async (supplierId: string) => {
    try {
      const trendsData = await supplierPerformanceService.getDeliveryTrends(supplierId, 12);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading supplier trends:', error);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  const getReliabilityIcon = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'good':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      case 'average':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 15.39l-3.76 2.27.99-4.28-3.32-2.88 4.38-.37L12 6.09l1.71 4.04 4.38.37-3.32 2.88.99 4.28z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Performance</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor supplier reliability, delivery performance, and cost trends</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-90-days">Last 90 Days</option>
            <option value="last-6-months">Last 6 Months</option>
            <option value="last-year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{performanceData.length}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Active Suppliers</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {performanceData.filter(s => s.performanceScore >= 75).length}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">High Performers</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {performanceData.length > 0 
              ? `${Math.round(performanceData.reduce((sum, s) => sum + s.averageDeliveryDays, 0) / performanceData.length)}` 
              : '0'
            }
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Delivery Days</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {performanceData.length > 0 
              ? `${Math.round(performanceData.reduce((sum, s) => sum + s.orderAccuracy, 0) / performanceData.length)}%` 
              : '0%'
            }
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Order Accuracy</p>
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supplier Rankings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Performance scores based on delivery, cost stability, and quality metrics
          </p>
        </div>
        <div className="p-6">
          {performanceData.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Supplier Data</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Add suppliers and create purchase orders to start tracking performance metrics.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Supplier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">On-Time %</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Accuracy</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((supplier, index) => (
                    <tr 
                      key={supplier.supplierId} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedSupplier(supplier)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                            index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{supplier.supplierName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Last order: {supplier.lastOrderDate ? supplier.lastOrderDate.toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPerformanceColor(supplier.performanceScore)}`}>
                          {supplier.performanceScore}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getReliabilityIcon(supplier.reliabilityRating)}
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {supplier.reliabilityRating}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {supplier.totalOrders > 0 
                            ? `${Math.round((supplier.onTimeDeliveries / supplier.completedOrders) * 100)}%`
                            : 'N/A'
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {Math.round(supplier.orderAccuracy)}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {supplier.totalOrders}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplier(supplier);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Supplier Performance (if selected) */}
      {selectedSupplier && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSupplier.supplierName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Detailed Performance Metrics</p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Delivery Performance */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Delivery Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">On-Time Deliveries</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedSupplier.onTimeDeliveries} / {selectedSupplier.completedOrders}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Delivery Time</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(selectedSupplier.averageDeliveryDays)} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reliability</span>
                    <div className="flex items-center gap-2">
                      {getReliabilityIcon(selectedSupplier.reliabilityRating)}
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {selectedSupplier.reliabilityRating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Cost Analysis</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Orders Value</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${selectedSupplier.totalOrderValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${selectedSupplier.averageOrderValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cost Trend</span>
                    <span className={`font-medium capitalize ${
                      selectedSupplier.costTrend === 'increasing' ? 'text-red-600' :
                      selectedSupplier.costTrend === 'decreasing' ? 'text-green-600' :
                      'text-gray-900 dark:text-white'
                    }`}>
                      {selectedSupplier.costTrend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Quality Metrics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Order Accuracy</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(selectedSupplier.orderAccuracy)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Orders</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedSupplier.totalOrders}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Performance Score</span>
                    <span className={`font-medium px-2 py-1 rounded-full text-sm ${getPerformanceColor(selectedSupplier.performanceScore)}`}>
                      {selectedSupplier.performanceScore}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Trends Chart Placeholder */}
            {trends.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Performance Trends (Last 12 Months)</h4>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">Chart visualization coming soon</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {trends.length} months of performance data available
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};