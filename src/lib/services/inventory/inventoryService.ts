import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Product, InventoryTransaction, InventoryReplenishmentInput } from '../products/types';
import { 
  InventoryResponse, 
  StockMovementResult, 
  LowStockAlert, 
  InventoryValuation,
  InventoryAnalytics 
} from './types';
import { WACCalculator } from './wacCalculator';

export class InventoryService {
  private static readonly COLLECTIONS = {
    PRODUCTS: 'products',
    INVENTORY_TRANSACTIONS: 'inventoryTransactions'
  } as const;

  /**
   * Add new inventory (replenishment)
   * Updates WAC and creates transaction record
   */
  static async replenishInventory(
    replenishment: InventoryReplenishmentInput
  ): Promise<StockMovementResult> {
    try {
      // Get current product data
      const productRef = doc(db, this.COLLECTIONS.PRODUCTS, replenishment.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return {
          success: false,
          newStock: 0,
          error: 'Product not found'
        };
      }

      const product = productSnap.data() as Product;
      const currentStock = product.totalUnits || product.stock || 0;
      const currentWAC = product.weightedAverageCost || product.costPrice || 0;

      // Calculate new WAC
      const wacResult = WACCalculator.calculateNewWAC(
        currentStock,
        currentWAC,
        replenishment.quantity,
        replenishment.unitCost
      );

      // Create cost entry
      const costEntry = WACCalculator.createCostEntry(
        replenishment.quantity,
        replenishment.unitCost,
        wacResult.newWeightedAverageCost,
        replenishment.supplierId,
        replenishment.invoiceReference
      );

      // Update product with new inventory data
      const updatedCostHistory = [...(product.costHistory || []), costEntry];
      
      await updateDoc(productRef, {
        totalUnits: wacResult.newTotalUnits,
        totalCostValue: wacResult.newTotalValue,
        weightedAverageCost: wacResult.newWeightedAverageCost,
        lastPurchaseCost: replenishment.unitCost,
        costHistory: updatedCostHistory,
        stock: wacResult.newTotalUnits, // Update stock to match total units
        updatedAt: Timestamp.now()
      });

      // Create inventory transaction record
      const transaction: Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        productId: replenishment.productId,
        type: 'purchase',
        quantity: replenishment.quantity,
        unitCost: replenishment.unitCost,
        totalCost: replenishment.quantity * replenishment.unitCost,
        supplierId: replenishment.supplierId,
        reference: replenishment.invoiceReference || `INV-${Date.now()}`,
        notes: replenishment.notes,
        createdBy: 'system' // TODO: Replace with actual user ID
      };

      const transactionRef = await addDoc(
        collection(db, this.COLLECTIONS.INVENTORY_TRANSACTIONS),
        {
          ...transaction,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      );

      return {
        success: true,
        newStock: wacResult.newTotalUnits,
        newWeightedAverageCost: wacResult.newWeightedAverageCost,
        transaction: {
          ...transaction,
          id: transactionRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      };

    } catch (error) {
      console.error('Error replenishing inventory:', error);
      return {
        success: false,
        newStock: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Process stock reduction (sale, adjustment, etc.)
   */
  static async reduceStock(
    productId: string,
    quantity: number,
    type: 'sale' | 'adjustment' = 'sale',
    reference?: string,
    notes?: string
  ): Promise<StockMovementResult> {
    try {
      const productRef = doc(db, this.COLLECTIONS.PRODUCTS, productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return {
          success: false,
          newStock: 0,
          error: 'Product not found'
        };
      }

      const product = productSnap.data() as Product;
      const currentStock = product.totalUnits || product.stock || 0;

      if (currentStock < quantity) {
        return {
          success: false,
          newStock: currentStock,
          error: 'Insufficient stock'
        };
      }

      const newStock = currentStock - quantity;
      const currentWAC = product.weightedAverageCost || product.costPrice || 0;

      // Calculate new total cost value (WAC stays the same, just reduce total value)
      const newTotalCostValue = newStock * currentWAC;

      // Update product
      await updateDoc(productRef, {
        totalUnits: newStock,
        totalCostValue: newTotalCostValue,
        stock: newStock,
        updatedAt: Timestamp.now()
      });

      // Create transaction record
      const transaction: Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        productId,
        type,
        quantity: -quantity, // Negative for stock reduction
        unitCost: currentWAC,
        totalCost: -(quantity * currentWAC),
        reference: reference || `${type.toUpperCase()}-${Date.now()}`,
        notes,
        createdBy: 'system' // TODO: Replace with actual user ID
      };

      const transactionRef = await addDoc(
        collection(db, this.COLLECTIONS.INVENTORY_TRANSACTIONS),
        {
          ...transaction,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      );

      return {
        success: true,
        newStock,
        newWeightedAverageCost: currentWAC,
        transaction: {
          ...transaction,
          id: transactionRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      };

    } catch (error) {
      console.error('Error reducing stock:', error);
      return {
        success: false,
        newStock: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get products with low stock alerts
   */
  static async getLowStockAlerts(): Promise<InventoryResponse<LowStockAlert[]>> {
    try {
      const productsRef = collection(db, this.COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(productsRef);
      
      const lowStockItems: LowStockAlert[] = [];

      snapshot.forEach((doc) => {
        const product = doc.data() as Product;
        const currentStock = product.totalUnits || product.stock || 0;
        const reorderPoint = product.reorderPoint || product.minStock || 0;

        if (currentStock <= reorderPoint && reorderPoint > 0) {
          lowStockItems.push({
            productId: doc.id,
            productName: product.name,
            currentStock,
            reorderPoint,
            reorderQuantity: product.reorderQuantity || 0
          });
        }
      });

      return {
        success: true,
        data: lowStockItems
      };

    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get inventory valuation report
   */
  static async getInventoryValuation(): Promise<InventoryResponse<InventoryAnalytics>> {
    try {
      const productsRef = collection(db, this.COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(productsRef);
      
      let totalInventoryValue = 0;
      let totalProducts = 0;
      let lowStockItems = 0;
      let totalCostVariance = 0;
      const topValueProducts: InventoryValuation[] = [];

      snapshot.forEach((doc) => {
        const product = doc.data() as Product;
        const currentStock = product.totalUnits || product.stock || 0;
        const wac = product.weightedAverageCost || product.costPrice || 0;
        const lastPurchaseCost = product.lastPurchaseCost || product.costPrice || 0;
        const totalValue = currentStock * wac;
        const reorderPoint = product.reorderPoint || product.minStock || 0;

        if (currentStock > 0) {
          totalInventoryValue += totalValue;
          totalProducts++;

          const costVariance = ((lastPurchaseCost - wac) / wac) * 100;
          totalCostVariance += Math.abs(costVariance);

          if (currentStock <= reorderPoint && reorderPoint > 0) {
            lowStockItems++;
          }

          topValueProducts.push({
            productId: doc.id,
            productName: product.name,
            currentStock,
            weightedAverageCost: wac,
            totalValue,
            lastPurchaseCost,
            costVariance
          });
        }
      });

      // Sort by total value descending and take top 10
      topValueProducts.sort((a, b) => b.totalValue - a.totalValue);
      const topTen = topValueProducts.slice(0, 10);

      const averageCostVariance = totalProducts > 0 ? totalCostVariance / totalProducts : 0;

      // Get low stock alerts
      const lowStockResponse = await this.getLowStockAlerts();
      const reorderAlerts = lowStockResponse.data || [];

      return {
        success: true,
        data: {
          totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
          totalProducts,
          lowStockItems,
          averageCostVariance: Math.round(averageCostVariance * 100) / 100,
          topValueProducts: topTen,
          reorderAlerts
        }
      };

    } catch (error) {
      console.error('Error getting inventory valuation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Adjust inventory (increase, decrease, or correction)
   */
  static async adjustInventory(adjustment: {
    productId: string;
    adjustmentType: 'increase' | 'decrease' | 'correction';
    quantity: number;
    reason: string;
    unitCost?: number;
    notes?: string;
  }): Promise<StockMovementResult> {
    try {
      const productRef = doc(db, this.COLLECTIONS.PRODUCTS, adjustment.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return {
          success: false,
          newStock: 0,
          error: 'Product not found'
        };
      }

      const product = productSnap.data() as Product;
      const currentStock = product.totalUnits || product.stock || 0;
      
      let newStock = currentStock;
      let transactionQuantity = adjustment.quantity;
      const transactionType = 'adjustment' as const;

      // Calculate new stock based on adjustment type
      if (adjustment.adjustmentType === 'increase') {
        newStock = currentStock + adjustment.quantity;
      } else if (adjustment.adjustmentType === 'decrease') {
        newStock = Math.max(0, currentStock - adjustment.quantity);
        transactionQuantity = -adjustment.quantity;
      } else if (adjustment.adjustmentType === 'correction') {
        newStock = adjustment.quantity;
        transactionQuantity = adjustment.quantity - currentStock;
      }

      // Update product stock
      await updateDoc(productRef, {
        stock: newStock,
        totalUnits: newStock,
        updatedAt: Timestamp.now()
      });

      // Create transaction record
      const transaction = {
        productId: adjustment.productId,
        type: transactionType,
        quantity: transactionQuantity,
        unitCost: adjustment.unitCost,
        reference: `ADJ-${Date.now()}`,
        notes: `${adjustment.adjustmentType.toUpperCase()}: ${adjustment.reason}${adjustment.notes ? ` - ${adjustment.notes}` : ''}`,
        createdBy: 'system', // TODO: Get from auth context
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const transactionRef = await addDoc(
        collection(db, this.COLLECTIONS.INVENTORY_TRANSACTIONS), 
        transaction
      );

      return {
        success: true,
        newStock,
        transaction: {
          id: transactionRef.id,
          ...transaction
        } as InventoryTransaction
      };

    } catch (error) {
      console.error('Error adjusting inventory:', error);
      return {
        success: false,
        newStock: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get transaction history for a product or all products
   */
  static async getTransactionHistory(options: {
    productId?: string;
    type?: 'purchase' | 'sale' | 'adjustment' | 'transfer';
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<InventoryResponse<InventoryTransaction[]>> {
    try {
      const query = collection(db, this.COLLECTIONS.INVENTORY_TRANSACTIONS);
      const transactions: InventoryTransaction[] = [];
      
      const querySnapshot = await getDocs(query);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const transaction = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as InventoryTransaction;
        
        // Apply filters
        if (options.productId && transaction.productId !== options.productId) {
          return;
        }
        
        if (options.type && transaction.type !== options.type) {
          return;
        }
        
        if (options.startDate && transaction.createdAt) {
          const transactionDate = transaction.createdAt.toDate();
          if (transactionDate < options.startDate) {
            return;
          }
        }
        
        if (options.endDate && transaction.createdAt) {
          const transactionDate = transaction.createdAt.toDate();
          if (transactionDate > options.endDate) {
            return;
          }
        }
        
        transactions.push(transaction);
      });

      // Sort by date (newest first)
      transactions.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Apply limit
      const limitedTransactions = options.limit ? 
        transactions.slice(0, options.limit) : 
        transactions;

      // Get product names for transactions
      const productIds = [...new Set(limitedTransactions.map(t => t.productId))];
      const productPromises = productIds.map(async (productId) => {
        const productSnap = await getDoc(doc(db, this.COLLECTIONS.PRODUCTS, productId));
        return productSnap.exists() ? 
          { id: productId, name: productSnap.data().name } : 
          { id: productId, name: 'Unknown Product' };
      });
      
      const products = await Promise.all(productPromises);
      const productMap = Object.fromEntries(
        products.map(p => [p.id, p.name])
      );

      // Add product names and calculate running totals
      const runningStock: { [productId: string]: number } = {};
      
      limitedTransactions.forEach((transaction) => {
        transaction.productName = productMap[transaction.productId];
        
        if (!runningStock[transaction.productId]) {
          runningStock[transaction.productId] = 0;
        }
        
        runningStock[transaction.productId] += transaction.quantity;
        transaction.runningTotal = runningStock[transaction.productId];
      });

      return {
        success: true,
        data: limitedTransactions
      };

    } catch (error) {
      console.error('Error getting transaction history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add a transaction directly (for barcode scanning and quick movements)
   */
  static async addTransaction(transactionData: {
    productId: string;
    type: 'sale' | 'purchase' | 'adjustment' | 'transfer';
    quantity: number;
    unitPrice: number;
    totalValue: number;
    reason?: string;
    notes?: string;
  }): Promise<{ success: boolean; transaction?: InventoryTransaction; error?: string }> {
    try {
      // Handle the transaction based on type
      if (transactionData.type === 'purchase') {
        // Use replenishInventory for purchases
        const result = await this.replenishInventory({
          productId: transactionData.productId,
          quantity: Math.abs(transactionData.quantity),
          unitCost: transactionData.unitPrice,
          supplierId: 'barcode-quick-purchase',
          invoiceReference: 'Quick Purchase',
          notes: transactionData.reason || transactionData.notes || 'Quick purchase via barcode scan'
        });
        return {
          success: result.success,
          transaction: result.transaction,
          error: result.error
        };
      } else if (transactionData.type === 'sale') {
        // Use reduceStock for sales
        const result = await this.reduceStock(
          transactionData.productId,
          Math.abs(transactionData.quantity),
          'sale',
          'barcode-quick-sale',
          transactionData.reason || transactionData.notes || 'Quick sale via barcode scan'
        );
        return {
          success: result.success,
          transaction: result.transaction,
          error: result.error
        };
      } else if (transactionData.type === 'adjustment') {
        // Use adjustInventory for adjustments
        const adjustmentType = transactionData.quantity > 0 ? 'increase' : 'decrease';
        const result = await this.adjustInventory({
          productId: transactionData.productId,
          adjustmentType: adjustmentType,
          quantity: Math.abs(transactionData.quantity),
          reason: transactionData.reason || 'Quick adjustment via barcode scan',
          unitCost: transactionData.unitPrice,
          notes: transactionData.notes || 'Barcode scan adjustment'
        });
        return {
          success: result.success,
          transaction: result.transaction,
          error: result.error
        };
      } else {
        return {
          success: false,
          error: 'Unsupported transaction type'
        };
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export the class as default for named import
export const inventoryService = InventoryService;