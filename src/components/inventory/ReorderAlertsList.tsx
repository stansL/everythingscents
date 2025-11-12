import React, { useState, useEffect, useCallback } from 'react';
import { ReorderAlertsService, ReorderAlert, ReorderRecommendation } from '@/lib/services/inventory/reorderAlertsService';

interface ReorderAlertsListProps {
  className?: string;
  onAlertAction?: (alertId: string, action: 'acknowledge' | 'resolve' | 'order') => void;
}

export const ReorderAlertsList: React.FC<ReorderAlertsListProps> = ({
  className = '',
  onAlertAction
}) => {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'recommendations'>('alerts');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const [alertsResponse, recommendationsResponse] = await Promise.all([
        ReorderAlertsService.getActiveAlerts(),
        ReorderAlertsService.getReorderRecommendations()
      ]);

      if (alertsResponse.success) {
        setAlerts(alertsResponse.data || []);
      }

      if (recommendationsResponse.success) {
        setRecommendations(recommendationsResponse.data || []);
      }

    } catch (err) {
      setError('Failed to load reorder alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      const response = await ReorderAlertsService.acknowledgeAlert(alertId, 'current-user'); // TODO: Get from auth
      if (response.success) {
        await loadAlerts();
        onAlertAction?.(alertId, 'acknowledge');
      } else {
        setError(response.error || 'Failed to acknowledge alert');
      }
    } catch {
      setError('Failed to acknowledge alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      const response = await ReorderAlertsService.resolveAlert(alertId, 'current-user'); // TODO: Get from auth
      if (response.success) {
        await loadAlerts();
        onAlertAction?.(alertId, 'resolve');
      } else {
        setError(response.error || 'Failed to resolve alert');
      }
    } catch {
      setError('Failed to resolve alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePurchaseOrder = async (productId: string, quantity: number, supplierId?: string) => {
    if (!supplierId) {
      setError('No supplier specified for this product');
      return;
    }

    setActionLoading(productId);
    try {
      // TODO: Implement PO creation from alert
      // This would need more supplier details and product info
      onAlertAction?.(productId, 'order');
    } catch {
      setError('Failed to create purchase order');
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
        );
      case 'high':
        return (
          <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'medium':
        return (
          <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with tabs */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Inventory Alerts & Recommendations
          </h3>
          
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Active Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Recommendations ({recommendations.length})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Active Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-gray-900 dark:text-white font-medium">No Active Alerts</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                All products are currently above their reorder points.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`p-6 ${getPriorityColor(alert.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {getPriorityIcon(alert.priority)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {alert.productName}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          alert.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {alert.recommendedAction}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Current Stock:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {alert.currentStock} units
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Reorder Point:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {alert.reorderPoint} units
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Suggested Qty:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {alert.reorderQuantity} units
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Est. Cost:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            ${alert.estimatedCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Alert created: {formatDate(alert.alertDate)}</span>
                        {alert.suggestedSupplier && (
                          <span>Supplier: {alert.suggestedSupplier.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {alert.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === alert.id ? 'Processing...' : 'Acknowledge'}
                        </button>
                        
                        {alert.suggestedSupplier && (
                          <button
                            onClick={() => handleCreatePurchaseOrder(
                              alert.productId, 
                              alert.reorderQuantity, 
                              alert.suggestedSupplier?.id
                            )}
                            disabled={actionLoading === alert.productId}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-md transition-colors disabled:opacity-50"
                          >
                            {actionLoading === alert.productId ? 'Creating...' : 'Create PO'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === alert.id ? 'Processing...' : 'Resolve'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recommendations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-gray-900 dark:text-white font-medium">No Recommendations</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                No products approaching reorder points at this time.
              </p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.productId} className={`p-6 ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {getPriorityIcon(rec.priority)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {rec.productName}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          rec.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          rec.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {rec.daysUntilStockout <= 7 ? `${Math.ceil(rec.daysUntilStockout)} days` : 'APPROACHING'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Current:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {rec.currentStock}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Reorder At:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {rec.reorderPoint}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Recommended:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {rec.recommendedQuantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Daily Usage:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {rec.averageDailyUsage.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Est. Cost:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            ${rec.estimatedCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {rec.lastOrderDate && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Last order: {formatDate(rec.lastOrderDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};