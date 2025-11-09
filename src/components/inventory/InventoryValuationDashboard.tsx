"use client";

import React, { useState, useEffect } from 'react';
import { 
  inventoryValuationService, 
  InventoryValuationItem, 
  ValuationSummary, 
  CategoryValuation,
  VarianceAnalysis 
} from '@/lib/services/inventory/inventoryValuationService';

interface InventoryValuationDashboardProps {
  className?: string;
}

export const InventoryValuationDashboard: React.FC<InventoryValuationDashboardProps> = ({ className = '' }) => {
  const [valuationData, setValuationData] = useState<{
    items: InventoryValuationItem[];
    summary: ValuationSummary;
    categoryBreakdown: CategoryValuation[];
  }>({ items: [], summary: {} as ValuationSummary, categoryBreakdown: [] });
  
  const [varianceAnalysis, setVarianceAnalysis] = useState<VarianceAnalysis[]>([]);
  const [movementAnalysis, setMovementAnalysis] = useState<{
    slowMoving: InventoryValuationItem[];
    fastMoving: InventoryValuationItem[];
    deadStock: InventoryValuationItem[];
  }>({ slowMoving: [], fastMoving: [], deadStock: [] });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('current');

  useEffect(() => {
    loadValuationData();
  }, [dateRange]);

  const loadValuationData = async () => {
    try {
      setLoading(true);
      
      // Get current valuation
      const valuation = await inventoryValuationService.getInventoryValuation();
      setValuationData(valuation);

      // Get variance analysis (current vs previous month)
      const currentMonth = new Date();
      const previousMonth = new Date();
      previousMonth.setMonth(currentMonth.getMonth() - 1);
      
      const currentStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const currentEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const previousStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
      const previousEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);

      const variance = await inventoryValuationService.getVarianceAnalysis(
        { start: currentStart, end: currentEnd },
        { start: previousStart, end: previousEnd }
      );
      setVarianceAnalysis(variance);

      // Get movement analysis
      const movement = await inventoryValuationService.getInventoryMovementAnalysis();
      setMovementAnalysis(movement);

    } catch (error) {
      console.error('Error loading valuation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getVarianceColor = (percentage: number) => {
    if (percentage > 10) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    if (percentage < -10) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  const getMovementColor = (daysInInventory: number) => {
    if (daysInInventory <= 30) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (daysInInventory <= 90) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    if (daysInInventory <= 180) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Valuation</h2>
          <p className="text-gray-600 dark:text-gray-400">Weighted Average Cost analysis and profit margins</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="current">Current Inventory</option>
            <option value="last-month">Last Month</option>
            <option value="last-quarter">Last Quarter</option>
            <option value="last-year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCurrency(valuationData.summary.totalInventoryValue)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Inventory Value</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {Math.round(valuationData.summary.totalProfitMargin)}%
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Profit Margin</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {Math.round(valuationData.summary.variancePercentage * 100) / 100}%
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Price Variance</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {Math.round(valuationData.summary.averageTurnover * 100) / 100}x
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Turnover Ratio</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'categories', name: 'Categories', icon: '📁' },
              { id: 'variance', name: 'Variance Analysis', icon: '📈' },
              { id: 'movement', name: 'Movement Analysis', icon: '🔄' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Valued Products</h3>
              {valuationData.items.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Inventory Data</h4>
                  <p className="text-gray-500 dark:text-gray-400">Add products and inventory to view valuation analysis.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">WAC</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total Value</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Profit Margin</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Movement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valuationData.items.slice(0, 10).map((item) => (
                        <tr key={item.productId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.category}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-900 dark:text-white">
                            {item.currentStock.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-gray-900 dark:text-white">
                            {formatCurrency(item.weightedAverageCost)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(item.totalValue)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.profitMargin > 30 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              item.profitMargin > 15 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              item.profitMargin > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {Math.round(item.profitMargin)}%
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementColor(item.daysInInventory)}`}>
                              {Math.round(item.daysInInventory)}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {valuationData.categoryBreakdown.map((category) => (
                  <div key={category.category} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">{category.category}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Products</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{category.productCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(category.totalValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg WAC</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(category.averageWAC)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(category.profitMargin)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">% of Total</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(category.percentage)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variance Analysis Tab */}
          {activeTab === 'variance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cost Variance Analysis</h3>
              {varianceAnalysis.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Variance Data</h4>
                  <p className="text-gray-500 dark:text-gray-400">Need historical data to calculate price variances.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Current WAC</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Previous WAC</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Variance</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Impact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {varianceAnalysis.slice(0, 15).map((item) => (
                        <tr key={item.productId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                          </td>
                          <td className="py-4 px-4 text-gray-900 dark:text-white">
                            {formatCurrency(item.currentWAC)}
                          </td>
                          <td className="py-4 px-4 text-gray-900 dark:text-white">
                            {formatCurrency(item.previousWAC)}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVarianceColor(item.variancePercentage)}`}>
                              {item.variancePercentage > 0 ? '+' : ''}{Math.round(item.variancePercentage * 100) / 100}%
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${
                              item.impact === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              item.impact === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                              {item.impact}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${
                              item.significance === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              item.significance === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {item.significance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Movement Analysis Tab */}
          {activeTab === 'movement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fast Moving */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Fast Moving (≤30 days)
                  </h4>
                  <div className="space-y-2">
                    {movementAnalysis.fastMoving.slice(0, 5).map((item) => (
                      <div key={item.productId} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{item.productName}</p>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span>{Math.round(item.daysInInventory)} days</span>
                          <span>{formatCurrency(item.totalValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slow Moving */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    Slow Moving (180+ days)
                  </h4>
                  <div className="space-y-2">
                    {movementAnalysis.slowMoving.slice(0, 5).map((item) => (
                      <div key={item.productId} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{item.productName}</p>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span>{Math.round(item.daysInInventory)} days</span>
                          <span>{formatCurrency(item.totalValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dead Stock */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    Dead Stock (365+ days)
                  </h4>
                  <div className="space-y-2">
                    {movementAnalysis.deadStock.slice(0, 5).map((item) => (
                      <div key={item.productId} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{item.productName}</p>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span>{Math.round(item.daysInInventory)} days</span>
                          <span>{formatCurrency(item.totalValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};