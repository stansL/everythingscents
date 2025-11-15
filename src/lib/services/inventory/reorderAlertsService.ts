import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Product, Supplier, InventoryTransaction } from '../products/types';
import { InventoryResponse, LowStockAlert } from './types';

export interface ReorderAlert extends LowStockAlert {
  id: string;
  alertDate: Date;
  status: 'active' | 'acknowledged' | 'ordered' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  estimatedCost: number;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  recommendedQuantity: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  daysUntilStockout: number;
  averageDailyUsage: number;
  suggestedSupplier?: Supplier;
  estimatedCost: number;
  lastOrderDate?: Date;
  averageLeadTime: number;
}

export interface StockAnalytics {
  productId: string;
  averageDailyUsage: number;
  stockTurnover: number;
  daysOfStockRemaining: number;
  seasonalTrend: 'increasing' | 'decreasing' | 'stable';
  reorderFrequency: number; // days between reorders
  averageLeadTime: number; // average lead time in days
  lastOrderDate?: Date;
  predictedStockoutDate?: Date;
}

export class ReorderAlertsService {
  private static readonly COLLECTIONS = {
    REORDER_ALERTS: 'reorderAlerts',
    PRODUCTS: 'products',
    SUPPLIERS: 'suppliers',
    INVENTORY_TRANSACTIONS: 'inventoryTransactions'
  } as const;

  /**
   * Generate reorder alerts for products below reorder point
   */
  static async generateReorderAlerts(): Promise<InventoryResponse<ReorderAlert[]>> {
    try {
      const productsSnapshot = await getDocs(collection(db, this.COLLECTIONS.PRODUCTS));
      const alerts: ReorderAlert[] = [];

      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data() as Product;
        
        if (!product.isActive || !product.id) continue;

        const currentStock = product.totalUnits || product.stock || 0;
        const reorderPoint = product.reorderPoint || 0;
        
        if (currentStock <= reorderPoint) {
          const analytics = await this.getStockAnalytics(product.id);
          const priority = this.calculatePriority(currentStock, reorderPoint, analytics);
          
          // Check if alert already exists
          const existingAlert = await this.getActiveAlertForProduct(product.id);
          
          if (!existingAlert) {
            const alert = await this.createReorderAlert(product, analytics, priority);
            if (alert) alerts.push(alert);
          }
        }
      }

      return {
        success: true,
        data: alerts
      };

    } catch (error) {
      console.error('Error generating reorder alerts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all active reorder alerts
   */
  static async getActiveAlerts(): Promise<InventoryResponse<ReorderAlert[]>> {
    try {
      const alertsQuery = query(
        collection(db, this.COLLECTIONS.REORDER_ALERTS),
        where('status', '==', 'active'),
        orderBy('priority', 'desc'),
        orderBy('alertDate', 'desc')
      );

      const querySnapshot = await getDocs(alertsQuery);
      const alerts: ReorderAlert[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        alerts.push({
          id: doc.id,
          ...data,
          alertDate: data.alertDate?.toDate() || new Date(),
          acknowledgedAt: data.acknowledgedAt?.toDate(),
          resolvedAt: data.resolvedAt?.toDate()
        } as ReorderAlert);
      });

      return {
        success: true,
        data: alerts
      };

    } catch (error) {
      console.error('Error getting active alerts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get reorder recommendations for all products
   */
  static async getReorderRecommendations(): Promise<InventoryResponse<ReorderRecommendation[]>> {
    try {
      const productsSnapshot = await getDocs(collection(db, this.COLLECTIONS.PRODUCTS));
      const recommendations: ReorderRecommendation[] = [];

      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data() as Product;
        
        if (!product.isActive) continue;

        const currentStock = product.totalUnits || product.stock || 0;
        const reorderPoint = product.reorderPoint || 0;
        
        if (currentStock <= reorderPoint * 1.2 && product.id) { // Include products approaching reorder point
          const analytics = await this.getStockAnalytics(product.id);
          const recommendation = await this.createReorderRecommendation(product, analytics);
          recommendations.push(recommendation);
        }
      }

      // Sort by priority and days until stockout
      recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return a.daysUntilStockout - b.daysUntilStockout;
      });

      return {
        success: true,
        data: recommendations
      };

    } catch (error) {
      console.error('Error getting reorder recommendations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Acknowledge a reorder alert
   */
  static async acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<InventoryResponse<boolean>> {
    try {
      const alertRef = doc(db, this.COLLECTIONS.REORDER_ALERTS, alertId);
      
      await updateDoc(alertRef, {
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: Timestamp.now(),
        notes: notes || '',
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Resolve a reorder alert (when order is placed or issue is resolved)
   */
  static async resolveAlert(alertId: string, userId: string, notes?: string): Promise<InventoryResponse<boolean>> {
    try {
      const alertRef = doc(db, this.COLLECTIONS.REORDER_ALERTS, alertId);
      
      await updateDoc(alertRef, {
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: Timestamp.now(),
        notes: notes || '',
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('Error resolving alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get stock analytics for a product
   */
  static async getStockAnalytics(productId: string): Promise<StockAnalytics> {
    try {
      // Get transaction history for the last 90 days
      const transactionsQuery = query(
        collection(db, this.COLLECTIONS.INVENTORY_TRANSACTIONS),
        where('productId', '==', productId)
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => {
        const data = doc.data() as InventoryTransaction;
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });

      // Calculate analytics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const recentTransactions = transactions.filter(t => 
        t.createdAt && t.createdAt >= thirtyDaysAgo
      );
      const salesTransactions = recentTransactions.filter(t => t.type === 'sale');
      
      const totalSold = salesTransactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
      const averageDailyUsage = totalSold / 30;

      const purchaseTransactions = transactions.filter(t => 
        t.type === 'purchase' && t.createdAt && t.createdAt >= ninetyDaysAgo
      );

      const lastOrderDate = purchaseTransactions.length > 0 
        ? new Date(Math.max(...purchaseTransactions.map(t => (t.createdAt as Date).getTime())))
        : undefined;

      // Calculate average lead time (simplified)
      const averageLeadTime = 7; // Default to 7 days, would need supplier data for accuracy

      const currentStock = await this.getCurrentStock(productId);
      const daysOfStockRemaining = averageDailyUsage > 0 ? currentStock / averageDailyUsage : 999;
      
      const predictedStockoutDate = averageDailyUsage > 0 
        ? new Date(now.getTime() + daysOfStockRemaining * 24 * 60 * 60 * 1000)
        : undefined;

      return {
        productId,
        averageDailyUsage,
        stockTurnover: averageDailyUsage * 365 / Math.max(currentStock, 1),
        daysOfStockRemaining,
        seasonalTrend: 'stable', // Would need more complex analysis
        reorderFrequency: 30, // Simplified
        averageLeadTime,
        lastOrderDate,
        predictedStockoutDate
      };

    } catch (error) {
      console.error('Error calculating stock analytics:', error);
      return {
        productId,
        averageDailyUsage: 0,
        stockTurnover: 0,
        daysOfStockRemaining: 999,
        seasonalTrend: 'stable',
        reorderFrequency: 30,
        averageLeadTime: 7
      };
    }
  }

  /**
   * Private helper methods
   */
  private static async getCurrentStock(productId: string): Promise<number> {
    try {
      const productDoc = await getDoc(doc(db, this.COLLECTIONS.PRODUCTS, productId));
      if (productDoc.exists()) {
        const product = productDoc.data() as Product;
        return product.totalUnits || product.stock || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private static async getActiveAlertForProduct(productId: string): Promise<ReorderAlert | null> {
    try {
      const alertsQuery = query(
        collection(db, this.COLLECTIONS.REORDER_ALERTS),
        where('productId', '==', productId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(alertsQuery);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          alertDate: data.alertDate?.toDate() || new Date()
        } as ReorderAlert;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private static calculatePriority(
    currentStock: number, 
    reorderPoint: number, 
    analytics: StockAnalytics
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (currentStock <= 0) return 'critical';
    if (currentStock <= reorderPoint * 0.5) return 'high';
    if (analytics.daysOfStockRemaining <= 7) return 'high';
    if (currentStock <= reorderPoint * 0.75) return 'medium';
    return 'low';
  }

  private static async createReorderAlert(
    product: Product, 
    analytics: StockAnalytics, 
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<ReorderAlert | null> {
    try {
      const currentStock = product.totalUnits || product.stock || 0;
      const reorderQuantity = product.reorderQuantity || Math.max(product.reorderPoint || 0, 10);
      const estimatedCost = reorderQuantity * (product.weightedAverageCost || product.costPrice || 0);

      const recommendedAction = this.getRecommendedAction(currentStock, product.reorderPoint || 0, analytics);

      const alertData = {
        productId: product.id,
        productName: product.name,
        currentStock,
        reorderPoint: product.reorderPoint || 0,
        reorderQuantity,
        suggestedSupplier: product.supplierInfo ? {
          supplierId: product.supplierInfo.supplierId,
          supplierName: product.supplierInfo.supplierName
        } : undefined,
        alertDate: Timestamp.now(),
        status: 'active' as const,
        priority,
        recommendedAction,
        estimatedCost,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.REORDER_ALERTS), alertData);

      return {
        id: docRef.id,
        ...alertData,
        alertDate: new Date()
      } as ReorderAlert;

    } catch (error) {
      console.error('Error creating reorder alert:', error);
      return null;
    }
  }

  private static async createReorderRecommendation(
    product: Product, 
    analytics: StockAnalytics
  ): Promise<ReorderRecommendation> {
    const currentStock = product.totalUnits || product.stock || 0;
    const reorderPoint = product.reorderPoint || 0;
    const reorderQuantity = product.reorderQuantity || Math.max(reorderPoint, 10);
    
    // Calculate recommended quantity based on usage and lead time
    const safetyStock = Math.ceil(analytics.averageDailyUsage * 7); // 1 week safety stock
    const leadTimeStock = Math.ceil(analytics.averageDailyUsage * analytics.averageLeadTime);
    const recommendedQuantity = Math.max(reorderQuantity, safetyStock + leadTimeStock);

    const priority = this.calculatePriority(currentStock, reorderPoint, analytics);
    const estimatedCost = recommendedQuantity * (product.weightedAverageCost || product.costPrice || 0);

    return {
      productId: product.id || '',
      productName: product.name,
      currentStock,
      reorderPoint,
      recommendedQuantity,
      priority,
      daysUntilStockout: analytics.daysOfStockRemaining,
      averageDailyUsage: analytics.averageDailyUsage,
      estimatedCost,
      lastOrderDate: analytics.lastOrderDate,
      averageLeadTime: analytics.averageLeadTime
    };
  }

  private static getRecommendedAction(
    currentStock: number, 
    reorderPoint: number, 
    analytics: StockAnalytics
  ): string {
    if (currentStock <= 0) {
      return 'URGENT: Stock depleted. Place emergency order immediately.';
    }
    
    if (analytics.daysOfStockRemaining <= 3) {
      return 'CRITICAL: Stock will run out in 3 days or less. Place urgent order.';
    }
    
    if (analytics.daysOfStockRemaining <= 7) {
      return 'HIGH PRIORITY: Stock will run out within a week. Place order soon.';
    }
    
    if (currentStock <= reorderPoint) {
      return 'REORDER NEEDED: Stock below reorder point. Place standard order.';
    }
    
    return 'MONITOR: Stock approaching reorder point. Prepare to order.';
  }
}