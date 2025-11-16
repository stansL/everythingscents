/**
 * Order Service
 * Handles order management and Firebase integration
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Order, OrderStatus, OrderSource, OrderFilter, OrderSummary } from './types';
import { COLLECTIONS } from '../../firebase/collections';
import { mockOrders } from './mockData';

// Constants
const COLLECTION_NAME = COLLECTIONS.ORDERS || 'orders';
const USE_MOCK_DATA = true; // Set to false to use Firebase data

/**
 * Service Response Interface
 */
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Order Service Class
 * Provides methods for order CRUD operations and queries
 */
export class OrderService {
  /**
   * Generate next order number
   * Format: ORD-YYYY-XXXX
   */
  private static async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const ordersRef = collection(db, COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('orderNumber', '>=', `ORD-${year}-0000`),
      where('orderNumber', '<=', `ORD-${year}-9999`),
      orderBy('orderNumber', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return `ORD-${year}-0001`;
    }
    
    const lastOrderNumber = snapshot.docs[0].data().orderNumber;
    const lastNumber = parseInt(lastOrderNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    
    return `ORD-${year}-${nextNumber}`;
  }

  /**
   * Convert Firestore document to Order object
   */
  private static docToOrder(id: string, data: DocumentData): Order {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt?.toDate() || new Date(),
      estimatedDeliveryDate: data.estimatedDeliveryDate instanceof Date ? data.estimatedDeliveryDate : data.estimatedDeliveryDate?.toDate(),
      convertedAt: data.convertedAt instanceof Date ? data.convertedAt : data.convertedAt?.toDate(),
    } as Order;
  }

  /**
   * Create a new order
   */
  static async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Order>> {
    try {
      const orderNumber = await this.generateOrderNumber();
      const now = Timestamp.now();
      
      const newOrder = {
        ...orderData,
        orderNumber,
        createdAt: now,
        updatedAt: now,
        estimatedDeliveryDate: orderData.estimatedDeliveryDate 
          ? Timestamp.fromDate(orderData.estimatedDeliveryDate as Date)
          : null,
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), newOrder);
      
      return {
        success: true,
        data: this.docToOrder(docRef.id, { ...newOrder, createdAt: now.toDate(), updatedAt: now.toDate() }),
        message: 'Order created successfully',
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: 'Failed to create order',
      };
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string): Promise<ServiceResponse<Order>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, orderId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Order not found',
        };
      }
      
      return {
        success: true,
        data: this.docToOrder(docSnap.id, docSnap.data()),
        message: 'Order retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting order:', error);
      return {
        success: false,
        error: 'Failed to retrieve order',
      };
    }
  }

  /**
   * Update an existing order
   */
  static async updateOrder(orderId: string, updates: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt'>>): Promise<ServiceResponse<Order>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, orderId);
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        estimatedDeliveryDate: updates.estimatedDeliveryDate 
          ? Timestamp.fromDate(updates.estimatedDeliveryDate as Date)
          : undefined,
        convertedAt: updates.convertedAt
          ? Timestamp.fromDate(updates.convertedAt as Date)
          : undefined,
      };
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      
      if (!updatedDoc.exists()) {
        return {
          success: false,
          error: 'Order not found after update',
        };
      }
      
      return {
        success: true,
        data: this.docToOrder(updatedDoc.id, updatedDoc.data()),
        message: 'Order updated successfully',
      };
    } catch (error) {
      console.error('Error updating order:', error);
      return {
        success: false,
        error: 'Failed to update order',
      };
    }
  }

  /**
   * Delete an order
   */
  static async deleteOrder(orderId: string): Promise<ServiceResponse<void>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, orderId);
      await deleteDoc(docRef);
      
      return {
        success: true,
        message: 'Order deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting order:', error);
      return {
        success: false,
        error: 'Failed to delete order',
      };
    }
  }

  /**
   * Get all orders with optional filtering
   */
  static async getAllOrders(filter?: OrderFilter): Promise<ServiceResponse<Order[]>> {
    try {
      // Return mock data if flag is set
      if (USE_MOCK_DATA) {
        let filteredOrders = [...mockOrders];
        
        if (filter) {
          if (filter.status) {
            filteredOrders = filteredOrders.filter(o => o.status === filter.status);
          }
          if (filter.source) {
            filteredOrders = filteredOrders.filter(o => o.source === filter.source);
          }
        }
        
        return {
          success: true,
          data: filteredOrders,
        };
      }
      
      const ordersRef = collection(db, COLLECTION_NAME);
      const constraints: QueryConstraint[] = [];
      
      // Apply filters
      if (filter) {
        if (filter.status) {
          constraints.push(where('status', '==', filter.status));
        }
        if (filter.source) {
          constraints.push(where('source', '==', filter.source));
        }
        if (filter.customerId) {
          constraints.push(where('customerId', '==', filter.customerId));
        }
        if (filter.dateFrom) {
          const timestamp = filter.dateFrom instanceof Date 
            ? Timestamp.fromDate(filter.dateFrom)
            : filter.dateFrom;
          constraints.push(where('createdAt', '>=', timestamp));
        }
        if (filter.dateTo) {
          const timestamp = filter.dateTo instanceof Date 
            ? Timestamp.fromDate(filter.dateTo)
            : filter.dateTo;
          constraints.push(where('createdAt', '<=', timestamp));
        }
      }
      
      // Default sorting by creation date (newest first)
      constraints.push(orderBy('createdAt', 'desc'));
      
      const q = query(ordersRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const orders = snapshot.docs.map(doc => this.docToOrder(doc.id, doc.data()));
      
      return {
        success: true,
        data: orders,
        message: 'Orders retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      return {
        success: false,
        error: 'Failed to retrieve orders',
      };
    }
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(status: OrderStatus): Promise<ServiceResponse<Order[]>> {
    return this.getAllOrders({ status });
  }

  /**
   * Get orders by customer
   */
  static async getOrdersByCustomer(customerId: string): Promise<ServiceResponse<Order[]>> {
    return this.getAllOrders({ customerId });
  }

  /**
   * Get orders by source
   */
  static async getOrdersBySource(source: OrderSource): Promise<ServiceResponse<Order[]>> {
    return this.getAllOrders({ source });
  }

  /**
   * Get order summaries (lightweight list view)
   */
  static async getOrderSummaries(filter?: OrderFilter): Promise<ServiceResponse<OrderSummary[]>> {
    try {
      const result = await this.getAllOrders(filter);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        };
      }
      
      const summaries: OrderSummary[] = result.data.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        source: order.source,
        createdAt: order.createdAt,
      }));
      
      return {
        success: true,
        data: summaries,
        message: 'Order summaries retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting order summaries:', error);
      return {
        success: false,
        error: 'Failed to retrieve order summaries',
      };
    }
  }

  /**
   * Convert order to invoice
   * Updates order with invoiceId and convertedAt timestamp
   */
  static async markAsConverted(orderId: string, invoiceId: string): Promise<ServiceResponse<Order>> {
    return this.updateOrder(orderId, {
      invoiceId,
      convertedAt: new Date(),
      status: OrderStatus.CONFIRMED,
    });
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ServiceResponse<Order>> {
    return this.updateOrder(orderId, { status });
  }
}

// Singleton export for convenience
export const orderService = new OrderService();
