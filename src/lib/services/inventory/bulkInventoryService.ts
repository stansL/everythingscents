import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { inventoryService } from './inventoryService';

// Types for bulk operations
export interface BulkInventoryItem {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  adjustmentQuantity: number;
  newStock: number;
  unitCost: number;
  reason: string;
  notes?: string;
  status: 'pending' | 'processed' | 'error';
  errorMessage?: string;
}

export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    productId: string;
    error: string;
  }>;
}

export interface ExportData {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  weightedAverageCost: number;
  totalValue: number;
  lastUpdated: string;
  reorderPoint?: number;
  maxStock?: number;
}

export interface BulkUploadTemplate {
  headers: string[];
  sampleData: string[][];
  instructions: string[];
}

class BulkInventoryService {
  
  /**
   * Generate CSV template for bulk inventory adjustments
   */
  generateAdjustmentTemplate(): BulkUploadTemplate {
    return {
      headers: [
        'Product ID',
        'Product Name', 
        'Category',
        'Current Stock',
        'Adjustment Quantity',
        'Unit Cost',
        'Reason',
        'Notes'
      ],
      sampleData: [
        ['PROD001', 'Lavender Essential Oil', 'Essential Oils', '100', '+50', '25.00', 'Stock replenishment', 'Monthly restock'],
        ['PROD002', 'Rose Fragrance Oil', 'Fragrance Oils', '75', '-10', '15.50', 'Damaged goods', 'Broken bottles'],
        ['PROD003', '10ml Glass Bottle', 'Packaging', '500', '+200', '0.75', 'Bulk purchase', 'Quarterly order']
      ],
      instructions: [
        '1. Product ID must match existing products in the system',
        '2. Adjustment Quantity: Use + for additions, - for subtractions', 
        '3. Unit Cost should be the cost per unit for this adjustment',
        '4. Reason is required for all adjustments',
        '5. Notes are optional but recommended for tracking',
        '6. Do not modify the header row',
        '7. Maximum 1000 rows per upload'
      ]
    };
  }

  /**
   * Generate CSV template for bulk product creation
   */
  generateProductTemplate(): BulkUploadTemplate {
    return {
      headers: [
        'Product Name',
        'Category',
        'Description',
        'Initial Stock',
        'Unit Cost',
        'Reorder Point',
        'Max Stock',
        'Supplier ID',
        'SKU'
      ],
      sampleData: [
        ['Eucalyptus Essential Oil', 'Essential Oils', 'Pure eucalyptus oil for aromatherapy', '50', '20.00', '10', '200', 'SUP001', 'EO-EUC-001'],
        ['Vanilla Fragrance Oil', 'Fragrance Oils', 'Sweet vanilla scent for candles', '75', '12.50', '15', '300', 'SUP002', 'FO-VAN-001'],
        ['Amber Glass Bottles 30ml', 'Packaging', 'Dark amber glass bottles with dropper', '100', '1.25', '20', '500', 'SUP003', 'PKG-AGB-30']
      ],
      instructions: [
        '1. Product Name must be unique in the system',
        '2. Category should match existing categories or create new ones',
        '3. Initial Stock will set the starting inventory level',
        '4. Unit Cost is the initial weighted average cost',
        '5. Reorder Point triggers automatic reorder alerts',
        '6. Max Stock helps with inventory planning',
        '7. Supplier ID must match existing suppliers',
        '8. SKU should be unique identifier'
      ]
    };
  }

  /**
   * Parse CSV content into structured data
   */
  parseCSV(csvContent: string): { headers: string[]; rows: string[][] } {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = this.parseCSVRow(lines[0]);
    const rows = lines.slice(1).map(line => this.parseCSVRow(line));

    return { headers, rows };
  }

  /**
   * Parse a single CSV row handling quotes and commas
   */
  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Validate and process bulk inventory adjustments
   */
  async processBulkAdjustments(csvContent: string): Promise<BulkOperationResult> {
    try {
      const { headers, rows } = this.parseCSV(csvContent);
      
      // Validate headers
      const requiredHeaders = ['Product ID', 'Adjustment Quantity', 'Unit Cost', 'Reason'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Get header indices
      const headerIndices = {
        productId: headers.indexOf('Product ID'),
        productName: headers.indexOf('Product Name'),
        category: headers.indexOf('Category'),
        currentStock: headers.indexOf('Current Stock'),
        adjustmentQuantity: headers.indexOf('Adjustment Quantity'),
        unitCost: headers.indexOf('Unit Cost'),
        reason: headers.indexOf('Reason'),
        notes: headers.indexOf('Notes')
      };

      const bulkItems: BulkInventoryItem[] = [];
      const errors: Array<{ row: number; productId: string; error: string }> = [];

      // Validate and prepare each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because of header and 0-based index

        try {
          const item = await this.validateAndPrepareRow(row, headerIndices, rowNumber);
          bulkItems.push(item);
        } catch (error) {
          errors.push({
            row: rowNumber,
            productId: row[headerIndices.productId] || 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Process valid items
      let successful = 0;
      const batch = writeBatch(db);

      for (const item of bulkItems) {
        try {
          await this.processInventoryAdjustment(item, batch);
          successful++;
        } catch (error) {
          errors.push({
            row: bulkItems.indexOf(item) + 2,
            productId: item.productId,
            error: error instanceof Error ? error.message : 'Processing error'
          });
        }
      }

      // Commit batch operations
      if (successful > 0) {
        await batch.commit();
      }

      return {
        total: rows.length,
        successful,
        failed: errors.length,
        errors
      };

    } catch (error) {
      throw new Error(`CSV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export current inventory to CSV
   */
  async exportInventoryToCSV(): Promise<string> {
    try {
      // Get all products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const exportData: ExportData[] = [];

      // Get inventory data for each product
      for (const product of products) {
        try {
          const inventory = await inventoryService.getProductInventory(product.id);
          
          if (inventory) {
            exportData.push({
              productId: product.id,
              productName: product.name || 'Unknown',
              category: product.category || 'Uncategorized',
              currentStock: inventory.currentStock,
              weightedAverageCost: inventory.weightedAverageCost,
              totalValue: inventory.currentStock * inventory.weightedAverageCost,
              lastUpdated: inventory.lastUpdated?.toDate().toISOString() || new Date().toISOString(),
              reorderPoint: product.reorderPoint,
              maxStock: product.maxStock
            });
          }
        } catch (error) {
          console.warn(`Failed to get inventory for product ${product.id}:`, error);
        }
      }

      // Generate CSV content
      const headers = [
        'Product ID',
        'Product Name', 
        'Category',
        'Current Stock',
        'Weighted Average Cost',
        'Total Value',
        'Last Updated',
        'Reorder Point',
        'Max Stock'
      ];

      const csvRows = [
        headers.join(','),
        ...exportData.map(item => [
          this.escapeCSVField(item.productId),
          this.escapeCSVField(item.productName),
          this.escapeCSVField(item.category),
          item.currentStock.toString(),
          item.weightedAverageCost.toFixed(2),
          item.totalValue.toFixed(2),
          this.escapeCSVField(item.lastUpdated),
          item.reorderPoint?.toString() || '',
          item.maxStock?.toString() || ''
        ].join(','))
      ];

      return csvRows.join('\n');

    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export inventory transactions to CSV
   */
  async exportTransactionsToCSV(dateRange?: { start: Date; end: Date }): Promise<string> {
    try {
      let transactionsQuery = query(
        collection(db, 'inventoryTransactions'),
        ...(dateRange ? [
          where('transactionDate', '>=', Timestamp.fromDate(dateRange.start)),
          where('transactionDate', '<=', Timestamp.fromDate(dateRange.end))
        ] : [])
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const headers = [
        'Transaction ID',
        'Product ID',
        'Product Name',
        'Type',
        'Quantity',
        'Unit Price',
        'Total Amount',
        'Date',
        'Reference',
        'Notes'
      ];

      const csvRows = [
        headers.join(','),
        ...transactions.map(transaction => [
          this.escapeCSVField(transaction.id),
          this.escapeCSVField(transaction.productId || ''),
          this.escapeCSVField(transaction.productName || ''),
          this.escapeCSVField(transaction.type || ''),
          (transaction.quantity || 0).toString(),
          (transaction.unitPrice || 0).toFixed(2),
          ((transaction.quantity || 0) * (transaction.unitPrice || 0)).toFixed(2),
          transaction.transactionDate?.toDate().toISOString() || '',
          this.escapeCSVField(transaction.reference || ''),
          this.escapeCSVField(transaction.notes || '')
        ].join(','))
      ];

      return csvRows.join('\n');

    } catch (error) {
      throw new Error(`Transaction export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and prepare a single row for processing
   */
  private async validateAndPrepareRow(
    row: string[], 
    headerIndices: any, 
    rowNumber: number
  ): Promise<BulkInventoryItem> {
    const productId = row[headerIndices.productId]?.trim();
    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Validate product exists
    const productDoc = await getDocs(query(
      collection(db, 'products'),
      where('__name__', '==', productId)
    ));

    if (productDoc.empty) {
      throw new Error(`Product ${productId} not found`);
    }

    const productData = productDoc.docs[0].data();
    
    // Parse adjustment quantity
    const adjustmentStr = row[headerIndices.adjustmentQuantity]?.trim();
    if (!adjustmentStr) {
      throw new Error('Adjustment Quantity is required');
    }

    const adjustmentQuantity = parseFloat(adjustmentStr.replace(/[+\s]/g, ''));
    if (isNaN(adjustmentQuantity)) {
      throw new Error('Invalid adjustment quantity format');
    }

    // Parse unit cost
    const unitCostStr = row[headerIndices.unitCost]?.trim();
    if (!unitCostStr) {
      throw new Error('Unit Cost is required');
    }

    const unitCost = parseFloat(unitCostStr);
    if (isNaN(unitCost) || unitCost < 0) {
      throw new Error('Invalid unit cost');
    }

    // Validate reason
    const reason = row[headerIndices.reason]?.trim();
    if (!reason) {
      throw new Error('Reason is required');
    }

    // Get current stock
    let currentStock = 0;
    try {
      const inventory = await inventoryService.getProductInventory(productId);
      currentStock = inventory?.currentStock || 0;
    } catch (error) {
      // If no inventory record, assume 0 stock
      currentStock = 0;
    }

    const newStock = currentStock + adjustmentQuantity;
    if (newStock < 0) {
      throw new Error(`Insufficient stock. Current: ${currentStock}, Adjustment: ${adjustmentQuantity}`);
    }

    return {
      productId,
      productName: productData.name || row[headerIndices.productName]?.trim() || 'Unknown',
      category: productData.category || row[headerIndices.category]?.trim() || 'Uncategorized',
      currentStock,
      adjustmentQuantity,
      newStock,
      unitCost,
      reason,
      notes: row[headerIndices.notes]?.trim() || '',
      status: 'pending'
    };
  }

  /**
   * Process a single inventory adjustment
   */
  private async processInventoryAdjustment(item: BulkInventoryItem, batch: any): Promise<void> {
    const transactionData = {
      productId: item.productId,
      productName: item.productName,
      type: item.adjustmentQuantity > 0 ? 'purchase' : 'adjustment',
      quantity: Math.abs(item.adjustmentQuantity),
      unitPrice: item.unitCost,
      totalAmount: Math.abs(item.adjustmentQuantity) * item.unitCost,
      transactionDate: Timestamp.now(),
      reference: 'BULK_ADJUSTMENT',
      notes: `${item.reason}${item.notes ? ` - ${item.notes}` : ''}`,
      createdAt: Timestamp.now()
    };

    // Add transaction to batch
    const transactionRef = doc(collection(db, 'inventoryTransactions'));
    batch.set(transactionRef, transactionData);

    // Update inventory will be handled by the inventory service triggers
    // For now, we'll update it directly in the batch
    try {
      const inventory = await inventoryService.getProductInventory(item.productId);
      
      if (inventory) {
        // Calculate new WAC
        const currentValue = inventory.currentStock * inventory.weightedAverageCost;
        const adjustmentValue = Math.abs(item.adjustmentQuantity) * item.unitCost;
        
        let newWAC = inventory.weightedAverageCost;
        let newStock = item.newStock;
        
        if (item.adjustmentQuantity > 0) {
          // Adding stock - recalculate WAC
          const totalValue = currentValue + adjustmentValue;
          newWAC = newStock > 0 ? totalValue / newStock : item.unitCost;
        } else {
          // Removing stock - keep existing WAC
          newStock = Math.max(0, inventory.currentStock + item.adjustmentQuantity);
        }

        const inventoryRef = doc(db, 'inventory', item.productId);
        batch.update(inventoryRef, {
          currentStock: newStock,
          weightedAverageCost: newWAC,
          lastUpdated: Timestamp.now()
        });
      } else {
        // Create new inventory record
        const inventoryRef = doc(db, 'inventory', item.productId);
        batch.set(inventoryRef, {
          productId: item.productId,
          currentStock: Math.max(0, item.adjustmentQuantity),
          weightedAverageCost: item.unitCost,
          lastUpdated: Timestamp.now(),
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      throw new Error(`Failed to update inventory for ${item.productId}: ${error}`);
    }
  }

  /**
   * Escape CSV field for proper formatting
   */
  private escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Download CSV file
   */
  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

export const bulkInventoryService = new BulkInventoryService();