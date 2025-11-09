import { BaseEntity } from "../common/types";

export type ProductStatus = 'draft' | 'published' | 'inactive' | 'retired';

// ===============================
// Inventory Management Models
// ===============================

export interface InventoryTransaction extends BaseEntity {
  productId: string;
  productName?: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  supplierId?: string;
  reference: string; // PO number, invoice, etc.
  notes?: string;
  createdBy: string;
  runningTotal?: number; // Running stock total after transaction
}

export interface CostEntry {
  date: Date;
  quantity: number;
  unitCost: number;
  totalCost: number;
  runningAverage: number;
  supplierId?: string;
  invoiceReference?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson?: string;
}

export interface Supplier extends BaseEntity {
  name: string;
  code: string;
  contactInfo: ContactInfo;
  paymentTerms: string;
  leadTime: number; // days
  minimumOrder?: number;
  isActive: boolean;
  notes?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder extends BaseEntity {
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  totalAmount: number;
  orderDate: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  createdBy: string;
}

export interface SupplierInfo {
  supplierId?: string;
  supplierName?: string;
  lastPurchaseDate?: Date;
  averageLeadTime?: number;
}

export interface Product extends BaseEntity {
  // Basic Product Information
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  subcategoryId?: string;
  brand: string;
  images: string[];
  thumbnail?: string;
  
  // Pricing Information (Legacy - kept for backward compatibility)
  costPrice: number; // Current/latest cost price for display
  price: number;
  salePrice?: number;
  
  // Enhanced Inventory Management Fields
  totalCostValue: number; // Total value of current inventory at WAC
  totalUnits: number; // Total units in stock (can be different from stock for tracking)
  weightedAverageCost: number; // Current weighted average cost per unit
  lastPurchaseCost: number; // Most recent purchase cost per unit
  costHistory: CostEntry[]; // Historical cost tracking
  supplierInfo?: SupplierInfo; // Primary supplier information
  reorderPoint: number; // Minimum stock before reorder alert
  reorderQuantity: number; // Suggested reorder quantity
  
  // Physical Product Details
  stock: number; // Available units for sale
  minStock?: number; // Minimum stock alert (legacy - use reorderPoint instead)
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  // Product Attributes
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  status: ProductStatus;
  scentProfile?: {
    topNotes: string[];
    middleNotes: string[];
    baseNotes: string[];
  };
  scentType: 'perfume' | 'cologne' | 'body-spray' | 'candle' | 'diffuser' | 'other';
  size: string; // e.g., "50ml", "100ml", "3 oz"
  gender: 'men' | 'women' | 'unisex';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  longevity?: 'light' | 'moderate' | 'long-lasting' | 'very-long-lasting';
  sillage?: 'intimate' | 'moderate' | 'strong' | 'enormous';
  
  // Reviews & SEO
  rating?: number;
  reviewCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  
  // Business Logic
  taxable: boolean;
  collections: string[];
}

export interface ProductFilter {
  categoryId?: string;
  subcategoryId?: string;
  brand?: string;
  scentType?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  tags?: string[];
  season?: string;
  searchTerm?: string;
  status?: ProductStatus;
}

// Product Creation/Update Types
export type ProductCreateInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'totalCostValue' | 'totalUnits' | 'weightedAverageCost' | 'lastPurchaseCost' | 'costHistory'>;

export type ProductUpdateInput = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

// Inventory-specific types for transactions
export type InventoryTransactionCreateInput = Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt'>;

export type PurchaseOrderCreateInput = Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>;

export type SupplierCreateInput = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;

// Inventory Replenishment Input (for adding new stock)
export interface InventoryReplenishmentInput {
  productId: string;
  quantity: number;
  unitCost: number;
  supplierId?: string;
  invoiceReference?: string;
  notes?: string;
}

// Inventory Adjustment Input
export interface InventoryAdjustmentInput {
  productId: string;
  adjustmentType: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason: string;
  unitCost?: number;
  notes?: string;
}

// Supplier Input for creating/updating suppliers
export interface SupplierInput {
  name: string;
  code: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    contactPerson?: string;
  };
  paymentTerms: string;
  leadTime: number;
  minimumOrder?: number;
  notes?: string;
}

// Transaction type enum
export type InventoryTransactionType = 'purchase' | 'sale' | 'adjustment' | 'transfer';

// Purchase Order Status
export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';