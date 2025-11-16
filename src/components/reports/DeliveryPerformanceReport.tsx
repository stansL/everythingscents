'use client';

import { useEffect, useState, useCallback } from 'react';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { Invoice } from '@/lib/services/invoices/types';
import { formatAmountFromCents } from '@/lib/utils/formatters';

interface DeliveryMetrics {
  pending: {
    count: number;
    amount: number;
  };
  inTransit: {
    count: number;
    amount: number;
  };
  completed: {
    count: number;
    amount: number;
  };
  onTime: {
    count: number;
    percentage: number;
  };
  delayed: {
    count: number;
    percentage: number;
  };
  totalDeliveries: number;
  averageDeliveryTime: number;
}

export default function DeliveryPerformanceReport() {
  const [metrics, setMetrics] = useState<DeliveryMetrics>({
    pending: { count: 0, amount: 0 },
    inTransit: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    onTime: { count: 0, percentage: 0 },
    delayed: { count: 0, percentage: 0 },
    totalDeliveries: 0,
    averageDeliveryTime: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateDeliveryMetrics = (allInvoices: Invoice[]): DeliveryMetrics => {
    const deliveryMetrics: DeliveryMetrics = {
      pending: { count: 0, amount: 0 },
      inTransit: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      onTime: { count: 0, percentage: 0 },
      delayed: { count: 0, percentage: 0 },
      totalDeliveries: 0,
      averageDeliveryTime: 0,
    };

    let totalDeliveryDays = 0;
    let completedWithTimingCount = 0;

    allInvoices.forEach((invoice) => {
      // Only process invoices with delivery information
      if (invoice.deliveryInfo && invoice.deliveryInfo.status) {
        const deliveryStatus = invoice.deliveryInfo.status.toLowerCase();

        // Count by delivery status
        if (deliveryStatus === 'pending') {
          deliveryMetrics.pending.count++;
          deliveryMetrics.pending.amount += invoice.amount;
        } else if (deliveryStatus === 'out_for_delivery' || deliveryStatus === 'in_transit') {
          deliveryMetrics.inTransit.count++;
          deliveryMetrics.inTransit.amount += invoice.amount;
        } else if (deliveryStatus === 'completed' || deliveryStatus === 'delivered') {
          deliveryMetrics.completed.count++;
          deliveryMetrics.completed.amount += invoice.amount;

          // Calculate on-time vs delayed
          if (invoice.deliveryInfo.scheduledDate && invoice.deliveryInfo.completedDate) {
            const scheduled = new Date(invoice.deliveryInfo.scheduledDate);
            const completed = new Date(invoice.deliveryInfo.completedDate);

            // Calculate delivery time in days
            const deliveryTime = Math.floor(
              (completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24)
            );

            totalDeliveryDays += Math.abs(deliveryTime);
            completedWithTimingCount++;

            if (completed <= scheduled) {
              deliveryMetrics.onTime.count++;
            } else {
              deliveryMetrics.delayed.count++;
            }
          }
        }

        deliveryMetrics.totalDeliveries++;
      }
    });

    // Calculate percentages
    const completedCount = deliveryMetrics.onTime.count + deliveryMetrics.delayed.count;
    if (completedCount > 0) {
      deliveryMetrics.onTime.percentage = (deliveryMetrics.onTime.count / completedCount) * 100;
      deliveryMetrics.delayed.percentage = (deliveryMetrics.delayed.count / completedCount) * 100;
    }

    // Calculate average delivery time
    if (completedWithTimingCount > 0) {
      deliveryMetrics.averageDeliveryTime = Math.round(totalDeliveryDays / completedWithTimingCount);
    }

    return deliveryMetrics;
  };

  const loadDeliveryData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await InvoiceService.getAllInvoices();

      if (response.success && response.data) {
        const calculatedMetrics = calculateDeliveryMetrics(response.data);
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error('Error loading delivery performance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveryData();
  }, [loadDeliveryData]);

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'pending':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'transit':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'truck':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Delivery Performance
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track delivery metrics and completion rates
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Deliveries Summary */}
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2.5">
                  {getStatusIcon('truck')}
                </div>
                <h3 className="text-base font-semibold">Total Deliveries</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {metrics.totalDeliveries}
                </p>
                <p className="text-xs opacity-90">
                  {metrics.averageDeliveryTime > 0
                    ? `Avg: ${metrics.averageDeliveryTime} days`
                    : 'No timing data'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Status Breakdown */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Pending */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-100 p-2.5 dark:bg-gray-700">
                    <div className="text-gray-600 dark:text-gray-400">
                      {getStatusIcon('pending')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pending</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Not yet dispatched</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {metrics.pending.count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAmountFromCents(metrics.pending.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* In Transit */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-100 p-2.5 dark:bg-amber-900/40">
                    <div className="text-amber-600 dark:text-amber-400">
                      {getStatusIcon('transit')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">In Transit</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Out for delivery</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {metrics.inTransit.count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAmountFromCents(metrics.inTransit.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2.5 dark:bg-green-900/40">
                    <div className="text-green-600 dark:text-green-400">
                      {getStatusIcon('completed')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Completed</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Successfully delivered</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {metrics.completed.count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAmountFromCents(metrics.completed.amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* On-Time Performance */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
              Delivery Performance
            </h3>
            
            {metrics.onTime.count + metrics.delayed.count > 0 ? (
              <div>
                {/* Combined Performance Bar */}
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-green-500"></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      On-Time
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {metrics.onTime.count} ({metrics.onTime.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-red-500"></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Delayed
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {metrics.delayed.count} ({metrics.delayed.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                {/* Prorated Progress Bar */}
                <div className="h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${metrics.onTime.percentage}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${metrics.delayed.percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No completed deliveries with timing data available
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {metrics.totalDeliveries === 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-700/30">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                No Delivery Data
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No invoices with delivery information found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
