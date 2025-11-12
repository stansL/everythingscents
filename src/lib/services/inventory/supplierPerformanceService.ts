import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Types for purchase orders
interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: string;
  orderDate: Timestamp;
  deliveredDate?: Timestamp;
  expectedDeliveryDate?: Timestamp;
  totalAmount: number;
  accuracy?: number;
  [key: string]: unknown;
}

// Types for supplier performance analytics
export interface SupplierPerformanceMetrics {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  completedOrders: number;
  onTimeDeliveries: number;
  averageDeliveryDays: number;
  orderAccuracy: number; // Percentage of orders delivered without discrepancies
  totalOrderValue: number;
  averageOrderValue: number;
  costTrend: 'increasing' | 'decreasing' | 'stable';
  costVariance: number; // Percentage change in average costs
  performanceScore: number; // Overall score 0-100
  lastOrderDate: Date | null;
  reliabilityRating: 'excellent' | 'good' | 'average' | 'poor';
}

export interface DeliveryPerformance {
  expectedDeliveryDate: Date;
  actualDeliveryDate: Date;
  daysEarly: number;
  daysLate: number;
  onTime: boolean;
}

export interface CostAnalysis {
  period: string;
  averageCost: number;
  totalValue: number;
  orderCount: number;
  variance: number;
}

export interface QualityMetrics {
  orderId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  discrepancies: number;
  qualityIssues: string[];
  accuracyScore: number;
}

export interface SupplierTrend {
  month: string;
  deliveryScore: number;
  costScore: number;
  qualityScore: number;
  overallScore: number;
}

interface DeliveryMetrics {
  onTimeCount: number;
  onTimePercentage: number;
  averageDays: number;
  totalDelivered: number;
}

interface CostMetrics {
  totalValue: number;
  averageValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  variance: number;
}

interface AggregatedQualityMetrics {
  accuracyPercentage: number;
  totalDiscrepancies: number;
  averageAccuracy: number;
}

class SupplierPerformanceService {
  
  /**
   * Get comprehensive performance metrics for a specific supplier
   */
  async getSupplierPerformance(supplierId: string, dateRange?: { start: Date; end: Date }): Promise<SupplierPerformanceMetrics | null> {
    try {
      // Get supplier details
      const supplierDoc = await getDoc(doc(db, 'suppliers', supplierId));
      if (!supplierDoc.exists()) {
        throw new Error('Supplier not found');
      }
      
      const supplierData = supplierDoc.data();
      
      // Build query for purchase orders
      let ordersQuery = query(
        collection(db, 'purchaseOrders'),
        where('supplierId', '==', supplierId),
        orderBy('orderDate', 'desc')
      );
      
      // Add date range filter if provided
      if (dateRange) {
        ordersQuery = query(
          collection(db, 'purchaseOrders'),
          where('supplierId', '==', supplierId),
          where('orderDate', '>=', Timestamp.fromDate(dateRange.start)),
          where('orderDate', '<=', Timestamp.fromDate(dateRange.end)),
          orderBy('orderDate', 'desc')
        );
      }
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PurchaseOrder));
      
      if (orders.length === 0) {
        return {
          supplierId,
          supplierName: supplierData.name,
          totalOrders: 0,
          completedOrders: 0,
          onTimeDeliveries: 0,
          averageDeliveryDays: 0,
          orderAccuracy: 0,
          totalOrderValue: 0,
          averageOrderValue: 0,
          costTrend: 'stable',
          costVariance: 0,
          performanceScore: 0,
          lastOrderDate: null,
          reliabilityRating: 'average'
        };
      }
      
      // Calculate delivery performance
      const deliveryMetrics = await this.calculateDeliveryMetrics(orders);
      
      // Calculate cost analysis
      const costMetrics = await this.calculateCostMetrics(orders);
      
      // Calculate quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(orders);
      
      // Calculate overall performance score
      const performanceScore = this.calculatePerformanceScore(
        deliveryMetrics,
        costMetrics,
        qualityMetrics
      );
      
      // Determine reliability rating
      const reliabilityRating = this.getReliabilityRating(performanceScore);
      
      return {
        supplierId,
        supplierName: supplierData.name,
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        onTimeDeliveries: deliveryMetrics.onTimeCount,
        averageDeliveryDays: deliveryMetrics.averageDays,
        orderAccuracy: qualityMetrics.accuracyPercentage,
        totalOrderValue: costMetrics.totalValue,
        averageOrderValue: costMetrics.averageValue,
        costTrend: costMetrics.trend,
        costVariance: costMetrics.variance,
        performanceScore,
        lastOrderDate: orders[0]?.orderDate?.toDate() || null,
        reliabilityRating
      };
      
    } catch (error) {
      console.error('Error getting supplier performance:', error);
      return null;
    }
  }
  
  /**
   * Get performance metrics for all suppliers
   */
  async getAllSuppliersPerformance(dateRange?: { start: Date; end: Date }): Promise<SupplierPerformanceMetrics[]> {
    try {
      // Get all suppliers
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliers = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get performance for each supplier
      const performancePromises = suppliers.map(supplier => 
        this.getSupplierPerformance(supplier.id, dateRange)
      );
      
      const performances = await Promise.all(performancePromises);
      
      // Filter out null results and sort by performance score
      return performances
        .filter((perf): perf is SupplierPerformanceMetrics => perf !== null)
        .sort((a, b) => b.performanceScore - a.performanceScore);
      
    } catch (error) {
      console.error('Error getting all suppliers performance:', error);
      return [];
    }
  }
  
  /**
   * Get delivery performance trends for a supplier
   */
  async getDeliveryTrends(supplierId: string, months: number = 12): Promise<SupplierTrend[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const ordersQuery = query(
        collection(db, 'purchaseOrders'),
        where('supplierId', '==', supplierId),
        where('orderDate', '>=', Timestamp.fromDate(startDate)),
        where('orderDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('orderDate', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PurchaseOrder));
      
      // Group orders by month
      const monthlyData = new Map<string, PurchaseOrder[]>();
      
      orders.forEach(order => {
        const orderDate = order.orderDate.toDate();
        const monthKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, []);
        }
        monthlyData.get(monthKey)!.push(order);
      });
      
      // Calculate trends for each month
      const trends: SupplierTrend[] = [];
      
      for (const [month, monthOrders] of monthlyData) {
        const deliveryMetrics = await this.calculateDeliveryMetrics(monthOrders);
        const costMetrics = await this.calculateCostMetrics(monthOrders);
        const qualityMetrics = await this.calculateQualityMetrics(monthOrders);
        
        const deliveryScore = (deliveryMetrics.onTimePercentage / 100) * 40; // 40% weight
        const costScore = Math.max(0, 100 - costMetrics.variance) * 0.3; // 30% weight
        const qualityScore = qualityMetrics.accuracyPercentage * 0.3; // 30% weight
        const overallScore = deliveryScore + costScore + qualityScore;
        
        trends.push({
          month,
          deliveryScore,
          costScore,
          qualityScore,
          overallScore
        });
      }
      
      return trends.sort((a, b) => a.month.localeCompare(b.month));
      
    } catch (error) {
      console.error('Error getting delivery trends:', error);
      return [];
    }
  }
  
  /**
   * Get top and bottom performing suppliers
   */
  async getSupplierRankings(limit: number = 10): Promise<{
    topPerformers: SupplierPerformanceMetrics[];
    bottomPerformers: SupplierPerformanceMetrics[];
  }> {
    try {
      const allPerformance = await this.getAllSuppliersPerformance();
      
      return {
        topPerformers: allPerformance.slice(0, limit),
        bottomPerformers: allPerformance.slice(-limit).reverse()
      };
      
    } catch (error) {
      console.error('Error getting supplier rankings:', error);
      return { topPerformers: [], bottomPerformers: [] };
    }
  }
  
  /**
   * Calculate delivery performance metrics
   */
  private async calculateDeliveryMetrics(orders: PurchaseOrder[]): Promise<{
    onTimeCount: number;
    onTimePercentage: number;
    averageDays: number;
    totalDelivered: number;
  }> {
    const completedOrders = orders.filter(o => o.status === 'completed' && o.deliveredDate);
    
    if (completedOrders.length === 0) {
      return {
        onTimeCount: 0,
        onTimePercentage: 0,
        averageDays: 0,
        totalDelivered: 0
      };
    }
    
    let onTimeCount = 0;
    let totalDays = 0;
    
    completedOrders.forEach(order => {
      const expectedDate = order.expectedDeliveryDate?.toDate();
      const actualDate = order.deliveredDate?.toDate();
      
      if (expectedDate && actualDate) {
        const daysDiff = Math.ceil((actualDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += Math.abs(daysDiff);
        
        // Consider on-time if delivered within 1 day of expected date
        if (daysDiff <= 1) {
          onTimeCount++;
        }
      }
    });
    
    return {
      onTimeCount,
      onTimePercentage: (onTimeCount / completedOrders.length) * 100,
      averageDays: totalDays / completedOrders.length,
      totalDelivered: completedOrders.length
    };
  }
  
  /**
   * Calculate cost-related metrics
   */
  private async calculateCostMetrics(orders: PurchaseOrder[]): Promise<{
    totalValue: number;
    averageValue: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    variance: number;
  }> {
    if (orders.length === 0) {
      return {
        totalValue: 0,
        averageValue: 0,
        trend: 'stable',
        variance: 0
      };
    }
    
    const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageValue = totalValue / orders.length;
    
    // Calculate trend (comparing first half vs second half of orders)
    const midpoint = Math.floor(orders.length / 2);
    const recentOrders = orders.slice(0, midpoint);
    const olderOrders = orders.slice(midpoint);
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let variance = 0;
    
    if (recentOrders.length > 0 && olderOrders.length > 0) {
      const recentAvg = recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / recentOrders.length;
      const olderAvg = olderOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / olderOrders.length;
      
      variance = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (Math.abs(variance) < 5) {
        trend = 'stable';
      } else if (variance > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }
    }
    
    return {
      totalValue,
      averageValue,
      trend,
      variance: Math.abs(variance)
    };
  }
  
  /**
   * Calculate quality/accuracy metrics
   */
  private async calculateQualityMetrics(orders: PurchaseOrder[]): Promise<AggregatedQualityMetrics> {
    const completedOrders = orders.filter(o => o.status === 'completed');
    
    if (completedOrders.length === 0) {
      return {
        accuracyPercentage: 0,
        totalDiscrepancies: 0,
        averageAccuracy: 0
      };
    }
    
    let totalAccuracyScore = 0;
    let totalDiscrepancies = 0;
    
    completedOrders.forEach(order => {
      // Simulate accuracy calculation - in real implementation, this would
      // compare ordered vs received quantities for each line item
      const accuracy = order.accuracy || 95; // Default high accuracy
      totalAccuracyScore += accuracy;
      
      if (accuracy < 100) {
        totalDiscrepancies++;
      }
    });
    
    return {
      accuracyPercentage: totalAccuracyScore / completedOrders.length,
      totalDiscrepancies,
      averageAccuracy: totalAccuracyScore / completedOrders.length
    };
  }
  
  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(
    deliveryMetrics: DeliveryMetrics,
    costMetrics: CostMetrics,
    qualityMetrics: AggregatedQualityMetrics
  ): number {
    // Weighted scoring:
    // - Delivery performance: 40%
    // - Cost stability: 30%  
    // - Quality/accuracy: 30%
    
    const deliveryScore = deliveryMetrics.onTimePercentage * 0.4;
    const costScore = Math.max(0, 100 - costMetrics.variance) * 0.3;
    const qualityScore = qualityMetrics.accuracyPercentage * 0.3;
    
    return Math.round(deliveryScore + costScore + qualityScore);
  }
  
  /**
   * Get reliability rating based on performance score
   */
  private getReliabilityRating(score: number): 'excellent' | 'good' | 'average' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }
}

export const supplierPerformanceService = new SupplierPerformanceService();