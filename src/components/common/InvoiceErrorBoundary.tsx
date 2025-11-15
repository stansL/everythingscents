'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class InvoiceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service in production
    console.error('Invoice component error:', error, errorInfo);
    
    // In production, you would send this to your error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom error fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-96 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center p-8">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-8 h-8 text-red-600 dark:text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              We&apos;re sorry, but something unexpected happened while loading the invoice data. 
              Please try refreshing the page or contact support if the problem persists.
            </p>
            
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="text-left text-xs text-gray-500 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <summary className="cursor-pointer font-medium mb-2">Error Details (Development)</summary>
                <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium 
                         rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 
                         text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors
                         focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}