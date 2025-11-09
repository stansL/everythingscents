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
import { PurchaseOrder, PurchaseOrderCreateInput, PurchaseOrderStatus } from '../products/types';
import { InventoryResponse } from './types';

export class PurchaseOrderService {
  private static readonly COLLECTION = 'purchaseOrders';

  /**
   * Create a new purchase order
   */
  static async createPurchaseOrder(orderData: PurchaseOrderCreateInput): Promise<InventoryResponse<PurchaseOrder>> {
    try {
      // Generate PO number (you might want to implement a more sophisticated system)
      const poNumber = `PO-${Date.now()}`;
      
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...orderData,
        poNumber,
        status: 'draft' as PurchaseOrderStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      const purchaseOrder: PurchaseOrder = {
        ...orderData,
        id: docRef.id,
        poNumber,
        status: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      return {
        success: true,
        data: purchaseOrder
      };

    } catch (error) {
      console.error('Error creating purchase order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update purchase order status
   */
  static async updateOrderStatus(orderId: string, status: PurchaseOrderStatus): Promise<InventoryResponse<boolean>> {
    try {
      const orderRef = doc(db, this.COLLECTION, orderId);
      
      await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('Error updating purchase order status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get purchase orders by status
   */
  static async getOrdersByStatus(status: PurchaseOrderStatus): Promise<InventoryResponse<PurchaseOrder[]>> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const orders: PurchaseOrder[] = [];

      snapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        } as PurchaseOrder);
      });

      return {
        success: true,
        data: orders
      };

    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get purchase order by ID
   */
  static async getOrderById(orderId: string): Promise<InventoryResponse<PurchaseOrder>> {
    try {
      const docRef = doc(db, this.COLLECTION, orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Purchase order not found'
        };
      }

      const order: PurchaseOrder = {
        id: docSnap.id,
        ...docSnap.data()
      } as PurchaseOrder;

      return {
        success: true,
        data: order
      };

    } catch (error) {
      console.error('Error getting purchase order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Mark purchase order as received and update inventory
   */
  static async markAsReceived(orderId: string, receivedQuantities: { [productId: string]: number }): Promise<InventoryResponse<boolean>> {
    try {
      // This is a placeholder for the actual implementation
      // In Phase 2, we'll integrate with InventoryService to update stock levels
      
      const orderRef = doc(db, this.COLLECTION, orderId);
      
      await updateDoc(orderRef, {
        status: 'received' as PurchaseOrderStatus,
        receivedDate: Timestamp.now(),
        receivedQuantities,
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('Error marking purchase order as received:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}