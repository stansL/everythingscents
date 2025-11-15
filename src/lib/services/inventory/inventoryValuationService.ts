import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  Timestamp,
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';


// Types for products and transactions
interface Product {
  id: string;
  name: string;
  category?: string;
  [key: string]: unknown;
}

interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer';
  quantity: number;
  unitPrice: number;
  transactionDate: { seconds: number } & Record<string, unknown>;
  [key: string]: unknown;
}

// Types for inventory valuation
export interface InventoryValuationItem {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  weightedAverageCost: number;
  totalValue: number;
  lastPurchasePrice: number;
  priceVariance: number;
  variancePercentage: number;
  profitMargin: number;
  totalSales: number;
  totalProfit: number;
  turnoverRatio: number;
  daysInInventory: number;
}

export interface ValuationSummary {
  totalInventoryValue: number;
  totalProducts: number;
  averageWAC: number;
  totalVariance: number;
  variancePercentage: number;
  totalProfitMargin: number;
  averageTurnover: number;
  slowMovingItems: number;
  fastMovingItems: number;
}

export interface CategoryValuation {
  category: string;
  productCount: number;
  totalValue: number;
  averageWAC: number;
  variance: number;
  profitMargin: number;
  percentage: number;
}

export interface PeriodComparison {
  period: string;
  totalValue: number;
  changeAmount: number;
  changePercentage: number;
  variance: number;
  profitMargin: number;
}

export interface VarianceAnalysis {
  productId: string;
  productName: string;
  currentWAC: number;
  previousWAC: number;
  variance: number;
  variancePercentage: number;
  impact: 'positive' | 'negative' | 'neutral';
  significance: 'high' | 'medium' | 'low';
}

class InventoryValuationService {
  
  /**
   * Get comprehensive inventory valuation report
   */
  async getInventoryValuation(dateRange?: { start: Date; end: Date }): Promise<{
    items: InventoryValuationItem[];
    summary: ValuationSummary;
    categoryBreakdown: CategoryValuation[];
  }> {
    try {
      // Get all products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      // Get inventory transactions for calculations
      let transactionsQuery = query(
        collection(db, 'inventoryTransactions'),
        orderBy('transactionDate', 'desc')
      );

      if (dateRange) {
        transactionsQuery = query(
          collection(db, 'inventoryTransactions'),
          where('transactionDate', '>=', Timestamp.fromDate(dateRange.start)),
          where('transactionDate', '<=', Timestamp.fromDate(dateRange.end)),
          orderBy('transactionDate', 'desc')
        );
      }

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryTransaction));

      // Calculate valuation for each product
      const valuationItems: InventoryValuationItem[] = [];
      
      for (const product of products) {
        const productTransactions = transactions.filter(t => t.productId === product.id);
        const valuation = await this.calculateProductValuation(product, productTransactions);
        if (valuation) {
          valuationItems.push(valuation);
        }
      }

      // Calculate summary
      const summary = this.calculateValuationSummary(valuationItems);

      // Calculate category breakdown
      const categoryBreakdown = this.calculateCategoryBreakdown(valuationItems);

      return {
        items: valuationItems.sort((a, b) => b.totalValue - a.totalValue),
        summary,
        categoryBreakdown
      };

    } catch (error) {
      console.error('Error getting inventory valuation:', error);
      return {
        items: [],
        summary: {
          totalInventoryValue: 0,
          totalProducts: 0,
          averageWAC: 0,
          totalVariance: 0,
          variancePercentage: 0,
          totalProfitMargin: 0,
          averageTurnover: 0,
          slowMovingItems: 0,
          fastMovingItems: 0
        },
        categoryBreakdown: []
      };
    }
  }

  /**
   * Get variance analysis comparing current and previous periods
   */
  async getVarianceAnalysis(currentPeriod: { start: Date; end: Date }, previousPeriod: { start: Date; end: Date }): Promise<VarianceAnalysis[]> {
    try {
      const currentValuation = await this.getInventoryValuation(currentPeriod);
      const previousValuation = await this.getInventoryValuation(previousPeriod);

      const varianceAnalysis: VarianceAnalysis[] = [];

      // Compare current vs previous for each product
      currentValuation.items.forEach(currentItem => {
        const previousItem = previousValuation.items.find(p => p.productId === currentItem.productId);
        
        if (previousItem) {
          const variance = currentItem.weightedAverageCost - previousItem.weightedAverageCost;
          const variancePercentage = ((variance / previousItem.weightedAverageCost) * 100);
          
          varianceAnalysis.push({
            productId: currentItem.productId,
            productName: currentItem.productName,
            currentWAC: currentItem.weightedAverageCost,
            previousWAC: previousItem.weightedAverageCost,
            variance,
            variancePercentage,
            impact: variance > 0 ? 'negative' : variance < 0 ? 'positive' : 'neutral',
            significance: Math.abs(variancePercentage) > 20 ? 'high' : Math.abs(variancePercentage) > 10 ? 'medium' : 'low'
          });
        }
      });

      return varianceAnalysis.sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage));

    } catch (error) {
      console.error('Error getting variance analysis:', error);
      return [];
    }
  }

  /**
   * Get period-over-period comparison
   */
  async getPeriodComparison(periods: Array<{ name: string; start: Date; end: Date }>): Promise<PeriodComparison[]> {
    try {
      const comparisons: PeriodComparison[] = [];
      
      for (const period of periods) {
        const valuation = await this.getInventoryValuation({ start: period.start, end: period.end });
        
        comparisons.push({
          period: period.name,
          totalValue: valuation.summary.totalInventoryValue,
          changeAmount: 0, // Will be calculated after all periods
          changePercentage: 0,
          variance: valuation.summary.totalVariance,
          profitMargin: valuation.summary.totalProfitMargin
        });
      }

      // Calculate changes
      for (let i = 1; i < comparisons.length; i++) {
        const current = comparisons[i];
        const previous = comparisons[i - 1];
        
        current.changeAmount = current.totalValue - previous.totalValue;
        current.changePercentage = ((current.changeAmount / previous.totalValue) * 100);
      }

      return comparisons;

    } catch (error) {
      console.error('Error getting period comparison:', error);
      return [];
    }
  }

  /**
   * Get slow and fast moving inventory analysis
   */
  async getInventoryMovementAnalysis(): Promise<{
    slowMoving: InventoryValuationItem[];
    fastMoving: InventoryValuationItem[];
    deadStock: InventoryValuationItem[];
  }> {
    try {
      const valuation = await this.getInventoryValuation();
      
      // Define thresholds for movement classification
      const slowMovingThreshold = 180; // Days
      const fastMovingThreshold = 30; // Days
      const deadStockThreshold = 365; // Days

      const slowMoving = valuation.items.filter(item => 
        item.daysInInventory > slowMovingThreshold && item.daysInInventory <= deadStockThreshold
      );

      const fastMoving = valuation.items.filter(item => 
        item.daysInInventory <= fastMovingThreshold
      );

      const deadStock = valuation.items.filter(item => 
        item.daysInInventory > deadStockThreshold
      );

      return {
        slowMoving: slowMoving.sort((a, b) => b.daysInInventory - a.daysInInventory),
        fastMoving: fastMoving.sort((a, b) => a.daysInInventory - b.daysInInventory),
        deadStock: deadStock.sort((a, b) => b.totalValue - a.totalValue)
      };

    } catch (error) {
      console.error('Error getting movement analysis:', error);
      return { slowMoving: [], fastMoving: [], deadStock: [] };
    }
  }

  /**
   * Calculate valuation for a single product
   */
  private async calculateProductValuation(product: Product, transactions: InventoryTransaction[]): Promise<InventoryValuationItem | null> {
    try {
      // Get current inventory levels from product data
      const currentStock = Number(product.totalUnits) || Number(product.stock) || 0;
      
      if (currentStock <= 0) {
        return null;
      }

      // Calculate WAC from product data
      const wac = Number(product.weightedAverageCost) || 0;
      
      // Calculate sales and profit from sale transactions
      const saleTransactions = transactions.filter(t => t.type === 'sale');
      const totalSales = saleTransactions.reduce((sum, t) => sum + (Number(t.unitCost || 0) * Number(t.quantity)), 0);
      const totalCost = saleTransactions.reduce((sum, t) => sum + (wac * Number(t.quantity)), 0);
      const totalProfit = totalSales - totalCost;
      
      // Calculate turnover ratio (sales / average inventory value)
      const averageInventoryValue = currentStock * wac;
      const turnoverRatio = averageInventoryValue > 0 ? totalSales / averageInventoryValue : 0;
      
      // Calculate days in inventory
      const daysInInventory = turnoverRatio > 0 ? 365 / turnoverRatio : 365;
      
      // Get last purchase price for variance calculation
      const purchaseTransactions = transactions
        .filter(t => t.type === 'purchase')
        .sort((a, b) => {
          const aSeconds = (a.createdAt as Timestamp)?.seconds || 0;
          const bSeconds = (b.createdAt as Timestamp)?.seconds || 0;
          return bSeconds - aSeconds;
        });
      
      const lastPurchasePrice = Number(purchaseTransactions.length > 0 ? (purchaseTransactions[0].unitCost || 0) : wac);
      const priceVariance = wac - lastPurchasePrice;
      const variancePercentage = lastPurchasePrice > 0 ? (priceVariance / lastPurchasePrice) * 100 : 0;
      
      // Calculate profit margin
      const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

      return {
        productId: product.id || '',
        productName: product.name,
        category: String(product.categoryId) || 'Uncategorized',
        currentStock: currentStock,
        weightedAverageCost: wac,
        totalValue: currentStock * wac,
        lastPurchasePrice,
        priceVariance,
        variancePercentage,
        profitMargin,
        totalSales,
        totalProfit,
        turnoverRatio,
        daysInInventory
      };

    } catch (error) {
      console.error('Error calculating product valuation:', error);
      return null;
    }
  }

  /**
   * Calculate overall valuation summary
   */
  private calculateValuationSummary(items: InventoryValuationItem[]): ValuationSummary {
    if (items.length === 0) {
      return {
        totalInventoryValue: 0,
        totalProducts: 0,
        averageWAC: 0,
        totalVariance: 0,
        variancePercentage: 0,
        totalProfitMargin: 0,
        averageTurnover: 0,
        slowMovingItems: 0,
        fastMovingItems: 0
      };
    }

    const totalInventoryValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const totalVariance = items.reduce((sum, item) => sum + item.priceVariance, 0);
    const averageWAC = items.reduce((sum, item) => sum + item.weightedAverageCost, 0) / items.length;
    const totalSales = items.reduce((sum, item) => sum + item.totalSales, 0);
    const totalProfit = items.reduce((sum, item) => sum + item.totalProfit, 0);
    const averageTurnover = items.reduce((sum, item) => sum + item.turnoverRatio, 0) / items.length;

    const slowMovingItems = items.filter(item => item.daysInInventory > 180).length;
    const fastMovingItems = items.filter(item => item.daysInInventory <= 30).length;

    return {
      totalInventoryValue,
      totalProducts: items.length,
      averageWAC,
      totalVariance,
      variancePercentage: totalInventoryValue > 0 ? (totalVariance / totalInventoryValue) * 100 : 0,
      totalProfitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
      averageTurnover,
      slowMovingItems,
      fastMovingItems
    };
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(items: InventoryValuationItem[]): CategoryValuation[] {
    const categoryMap = new Map<string, {
      productCount: number;
      totalValue: number;
      totalWAC: number;
      totalVariance: number;
      totalProfit: number;
      totalSales: number;
    }>();

    items.forEach(item => {
      const category = item.category;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          productCount: 0,
          totalValue: 0,
          totalWAC: 0,
          totalVariance: 0,
          totalProfit: 0,
          totalSales: 0
        });
      }

      const categoryData = categoryMap.get(category)!;
      categoryData.productCount++;
      categoryData.totalValue += item.totalValue;
      categoryData.totalWAC += item.weightedAverageCost;
      categoryData.totalVariance += item.priceVariance;
      categoryData.totalProfit += item.totalProfit;
      categoryData.totalSales += item.totalSales;
    });

    const totalInventoryValue = items.reduce((sum, item) => sum + item.totalValue, 0);

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      productCount: data.productCount,
      totalValue: data.totalValue,
      averageWAC: data.totalWAC / data.productCount,
      variance: data.totalVariance,
      profitMargin: data.totalSales > 0 ? (data.totalProfit / data.totalSales) * 100 : 0,
      percentage: totalInventoryValue > 0 ? (data.totalValue / totalInventoryValue) * 100 : 0
    })).sort((a, b) => b.totalValue - a.totalValue);
  }
}

export const inventoryValuationService = new InventoryValuationService();