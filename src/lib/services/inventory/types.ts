import { InventoryTransaction, CostEntry, Supplier } from '../products/types';

// Inventory Management Response Types
export interface InventoryResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WACalculationResult {
  newWeightedAverageCost: number;
  totalCostValue: number;
  totalUnits: number;
  costEntry: CostEntry;
}

export interface StockMovementResult {
  success: boolean;
  newStock: number;
  newWeightedAverageCost?: number;
  transaction?: InventoryTransaction;
  error?: string;
}

export interface PricingRecommendation {
  recommendedPrice: number;
  minimumPrice: number;
  currentMargin: number;
  recommendedMargin: number;
  profitPerUnit: number;
}

// Low Stock Alert
export interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  suggestedSupplier?: Supplier;
}

// Inventory Valuation
export interface InventoryValuation {
  productId: string;
  productName: string;
  currentStock: number;
  weightedAverageCost: number;
  totalValue: number;
  lastPurchaseCost: number;
  costVariance: number; // WAC vs Last Purchase Cost
}

// Inventory Analytics
export interface InventoryAnalytics {
  totalInventoryValue: number;
  totalProducts: number;
  lowStockItems: number;
  averageCostVariance: number;
  topValueProducts: InventoryValuation[];
  reorderAlerts: LowStockAlert[];
}