"use client";

import React, { useState, useRef } from 'react';
import { 
  bulkInventoryService, 
  BulkOperationResult,
  BulkUploadTemplate 
} from '@/lib/services/inventory/bulkInventoryService';

interface BulkInventoryOperationsProps {
  className?: string;
  showHeader?: boolean;
}

export const BulkInventoryOperations: React.FC<BulkInventoryOperationsProps> = ({ className = '', showHeader = true }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkOperationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [operationType, setOperationType] = useState<'adjustments' | 'products'>('adjustments');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      const fileContent = await selectedFile.text();
      
      if (operationType === 'adjustments') {
        const result = await bulkInventoryService.processBulkAdjustments(fileContent);
        setUploadResult(result);
      }
      // TODO: Add product creation support
      
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (type: 'adjustments' | 'products') => {
    let template: BulkUploadTemplate;
    let filename: string;
    
    if (type === 'adjustments') {
      template = bulkInventoryService.generateAdjustmentTemplate();
      filename = 'inventory_adjustment_template.csv';
    } else {
      template = bulkInventoryService.generateProductTemplate();
      filename = 'product_creation_template.csv';
    }
    
    const csvContent = [
      template.headers.join(','),
      ...template.sampleData.map(row => row.join(','))
    ].join('\n');
    
    bulkInventoryService.downloadCSV(csvContent, filename);
  };

  const exportInventory = async () => {
    setLoading(true);
    try {
      const csvContent = await bulkInventoryService.exportInventoryToCSV();
      const timestamp = new Date().toISOString().split('T')[0];
      bulkInventoryService.downloadCSV(csvContent, `inventory_export_${timestamp}.csv`);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = async () => {
    setLoading(true);
    try {
      // Export last 30 days by default
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const csvContent = await bulkInventoryService.exportTransactionsToCSV({ start: startDate, end: endDate });
      const timestamp = new Date().toISOString().split('T')[0];
      bulkInventoryService.downloadCSV(csvContent, `transactions_export_${timestamp}.csv`);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Inventory Operations</h2>
          <p className="text-gray-600 dark:text-gray-400">Import and export inventory data using CSV files</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'upload', name: 'Import Data', icon: '⬆️' },
              { id: 'export', name: 'Export Data', icon: '⬇️' },
              { id: 'templates', name: 'Templates', icon: '📋' },
              { id: 'help', name: 'Help', icon: '❓' }
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
          {/* Import Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Inventory Data</h3>
                
                {/* Operation Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Operation Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="adjustments"
                        checked={operationType === 'adjustments'}
                        onChange={(e) => setOperationType(e.target.value as 'adjustments')}
                        className="mr-2"
                      />
                      <span className="text-gray-900 dark:text-white">Inventory Adjustments</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="products"
                        checked={operationType === 'products'}
                        onChange={(e) => setOperationType(e.target.value as 'products')}
                        className="mr-2"
                        disabled
                      />
                      <span className="text-gray-400 dark:text-gray-500">Product Creation (Coming Soon)</span>
                    </label>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Choose CSV File
                      </button>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {selectedFile ? selectedFile.name : 'No file selected'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => downloadTemplate(operationType)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Download Template
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : null}
                    {loading ? 'Processing...' : 'Upload & Process'}
                  </button>
                </div>

                {/* Results */}
                {uploadResult && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Upload Results</h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{uploadResult.total}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Rows</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{uploadResult.successful}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                      </div>
                    </div>
                    
                    {uploadResult.errors.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-600 mb-2">Errors:</h5>
                        <div className="max-h-40 overflow-y-auto">
                          {uploadResult.errors.map((error, index) => (
                            <p key={index} className="text-sm text-red-600 dark:text-red-400">
                              Row {error.row} ({error.productId}): {error.error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Inventory Data</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Inventory Export */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Current Inventory</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Export current stock levels and valuations</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Includes product details, current stock, weighted average cost, and total values.
                  </p>
                  <button
                    onClick={exportInventory}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Exporting...' : 'Export Inventory'}
                  </button>
                </div>

                {/* Transaction History Export */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Transaction History</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Export inventory transaction records</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Includes all inventory movements from the last 30 days with full transaction details.
                  </p>
                  <button
                    onClick={exportTransactions}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Exporting...' : 'Export Transactions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CSV Templates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Adjustment Template */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Inventory Adjustments</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Template for bulk inventory adjustments (add/remove stock).
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 mb-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Required Fields:</h5>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Product ID (must exist in system)</li>
                      <li>• Adjustment Quantity (+/- format)</li>
                      <li>• Unit Cost (for WAC calculation)</li>
                      <li>• Reason (required for audit trail)</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => downloadTemplate('adjustments')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Download Template
                  </button>
                </div>

                {/* Product Template */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 opacity-50">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Product Creation</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Template for bulk product creation (coming soon).
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 mb-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Will Include:</h5>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Product Name</li>
                      <li>• Category & Description</li>
                      <li>• Initial Stock & Cost</li>
                      <li>• Reorder Points</li>
                    </ul>
                  </div>
                  
                  <button
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Help & Guidelines</h3>
              
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-2">⚠️ Important Notes</h4>
                  <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                    <li>• Always backup your data before bulk operations</li>
                    <li>• Test with small batches first (10-20 items)</li>
                    <li>• Maximum 1000 rows per CSV upload</li>
                    <li>• All operations are logged for audit purposes</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">CSV Format Guidelines</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li>• Use UTF-8 encoding</li>
                      <li>• Separate fields with commas</li>
                      <li>• Enclose text with commas in quotes</li>
                      <li>• Do not modify header row</li>
                      <li>• Remove empty rows at the end</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Common Issues</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li>• Product ID not found: Verify product exists</li>
                      <li>• Invalid quantity: Check number format</li>
                      <li>• Negative stock: Ensure sufficient inventory</li>
                      <li>• Missing required fields: Check template</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download the template files for proper formatting examples. 
                    Each template includes sample data and detailed instructions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};