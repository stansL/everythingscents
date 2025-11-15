/**
 * Performance monitoring utilities for production analytics
 */

import React from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

/**
 * Performance tracking utility for monitoring key metrics
 */
export class PerformanceTracker {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 100;

  /**
   * Track a custom performance metric
   */
  static trackMetric(name: string, value: number, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      ...metadata
    };

    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${name} = ${value}ms`, metadata);
    }
  }

  /**
   * Track page load performance
   */
  static trackPageLoad(pageName: string) {
    if (typeof window === 'undefined') return;

    // Use requestIdleCallback for better performance
    const trackWhenIdle = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.trackMetric(`${pageName}_dom_content_loaded`, navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        this.trackMetric(`${pageName}_load_complete`, navigation.loadEventEnd - navigation.loadEventStart);
        this.trackMetric(`${pageName}_total_load_time`, navigation.loadEventEnd - navigation.fetchStart);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(trackWhenIdle);
    } else {
      setTimeout(trackWhenIdle, 0);
    }
  }

  /**
   * Track component render performance
   */
  static trackRender(componentName: string, renderTime: number) {
    this.trackMetric(`${componentName}_render_time`, renderTime);
  }

  /**
   * Get all collected metrics
   */
  static getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get metrics summary for a specific component/page
   */
  static getMetricsSummary(prefix: string) {
    const filtered = this.metrics.filter(m => m.name.startsWith(prefix));
    if (filtered.length === 0) return null;

    const values = filtered.map(m => m.value);
    return {
      count: filtered.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: filtered[filtered.length - 1]?.value
    };
  }
}

/**
 * Hook for tracking component performance
 */
export const usePerformanceTracking = (componentName: string) => {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        PerformanceTracker.trackRender(componentName, renderTime);
      }
    };
  }, [componentName]);

  const trackOperation = React.useCallback((operationName: string, fn: () => void | Promise<void>) => {
    const start = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      result.finally(() => {
        const duration = performance.now() - start;
        PerformanceTracker.trackMetric(`${componentName}_${operationName}`, duration);
      });
    } else {
      const duration = performance.now() - start;
      PerformanceTracker.trackMetric(`${componentName}_${operationName}`, duration);
    }
    
    return result;
  }, [componentName]);

  return { trackOperation };
};