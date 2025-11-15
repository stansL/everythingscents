import React, { useState, useEffect } from 'react';
import { ReorderAlertsService, ReorderAlert } from '@/lib/services/inventory/reorderAlertsService';

interface ReorderAlertsDashboardProps {
  className?: string;
  onViewAll?: () => void;
}

export const ReorderAlertsDashboard: React.FC<ReorderAlertsDashboardProps> = ({
  className = '',
  onViewAll
}) => {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  });

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const response = await ReorderAlertsService.getActiveAlerts();
        
        if (response.success && response.data) {
          const alertsData = response.data;
          setAlerts(alertsData.slice(0, 5)); // Show only top 5 alerts
          
          // Calculate summary
          const newSummary = alertsData.reduce(
            (acc, alert) => {
              acc[alert.priority as keyof typeof acc]++;
              acc.total++;
              return acc;
            },
            { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
          );
          
          setSummary(newSummary);
        }
      } catch (err) {
        console.error('Error loading alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityIcon = (priority: string) => {
    const baseClasses = "w-3 h-3";
    switch (priority) {
      case 'critical':
        return (
          <svg className={`${baseClasses} text-red-500`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
        );
      case 'high':
        return (
          <svg className={`${baseClasses} text-orange-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className={`${baseClasses} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={`${baseClasses} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reorder Alerts
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.total} active alerts
              </p>
            </div>
          </div>
          
          {summary.total > 0 && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              View All
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary.total > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            {summary.critical > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {summary.critical}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Critical</div>
              </div>
            )}
            {summary.high > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {summary.high}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">High</div>
              </div>
            )}
            {summary.medium > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {summary.medium}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Medium</div>
              </div>
            )}
            {summary.low > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {summary.low}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Low</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No active reorder alerts. All products are well-stocked.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getPriorityIcon(alert.priority)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {alert.productName}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Stock: {alert.currentStock}</span>
                      <span>Reorder at: {alert.reorderPoint}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    alert.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              </div>
            ))}
            
            {summary.total > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={onViewAll}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  +{summary.total - 5} more alerts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};