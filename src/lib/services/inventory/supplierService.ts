import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Supplier, SupplierCreateInput } from '../products/types';
import { InventoryResponse } from './types';

export class SupplierService {
  private static readonly COLLECTION = 'suppliers';

  /**
   * Create a new supplier
   */
  static async createSupplier(supplierData: SupplierCreateInput): Promise<InventoryResponse<Supplier>> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...supplierData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      const supplier: Supplier = {
        ...supplierData,
        id: docRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      return {
        success: true,
        data: supplier
      };

    } catch (error) {
      console.error('Error creating supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all active suppliers
   */
  static async getActiveSuppliers(): Promise<InventoryResponse<Supplier[]>> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const suppliers: Supplier[] = [];

      snapshot.forEach((doc) => {
        suppliers.push({
          id: doc.id,
          ...doc.data()
        } as Supplier);
      });

      return {
        success: true,
        data: suppliers
      };

    } catch (error) {
      console.error('Error getting suppliers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update supplier information
   */
  static async updateSupplier(supplierId: string, updates: Partial<Supplier>): Promise<InventoryResponse<boolean>> {
    try {
      const supplierRef = doc(db, this.COLLECTION, supplierId);
      
      await updateDoc(supplierRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('Error updating supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(supplierId: string): Promise<InventoryResponse<Supplier>> {
    try {
      const docRef = doc(db, this.COLLECTION, supplierId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Supplier not found'
        };
      }

      const supplier: Supplier = {
        id: docSnap.id,
        ...docSnap.data()
      } as Supplier;

      return {
        success: true,
        data: supplier
      };

    } catch (error) {
      console.error('Error getting supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all suppliers (active and inactive)
   */
  static async getAllSuppliers(): Promise<InventoryResponse<Supplier[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION));
      const suppliers: Supplier[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        suppliers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Supplier);
      });

      // Sort by name
      suppliers.sort((a, b) => a.name.localeCompare(b.name));

      return {
        success: true,
        data: suppliers
      };

    } catch (error) {
      console.error('Error getting all suppliers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a supplier (soft delete by setting isActive to false)
   */
  static async deleteSupplier(supplierId: string): Promise<InventoryResponse<boolean>> {
    try {
      const supplierRef = doc(db, this.COLLECTION, supplierId);
      await updateDoc(supplierRef, {
        isActive: false,
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('Error deleting supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}