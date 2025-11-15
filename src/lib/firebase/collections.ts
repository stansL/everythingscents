/**
 * Firebase Firestore Collection Names
 * Centralized collection name constants for consistent reference
 */

export const COLLECTIONS = {
  // Invoice & Order Management
  INVOICES: 'invoices',
  ORDERS: 'orders',
  ORDER_ITEMS: 'orderItems',
  
  // Payment & Transaction Management
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transactions',
  MPESA_TRANSACTIONS: 'mpesaTransactions',
  
  // Product & Inventory Management
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  INVENTORY_MOVEMENTS: 'inventoryMovements',
  STOCK_ADJUSTMENTS: 'stockAdjustments',
  
  // Customer Management
  CUSTOMERS: 'customers',
  
  // User Management
  USERS: 'users',
  USER_PREFERENCES: 'userPreferences',
  
  // Notification Management
  NOTIFICATIONS: 'notifications',
  
  // Category Management
  CATEGORIES: 'categories',
  
  // Settings
  SETTINGS: 'settings',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
