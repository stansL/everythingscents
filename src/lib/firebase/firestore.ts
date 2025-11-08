import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  onSnapshot,
  Timestamp,
  WhereFilterOp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

// Types for query conditions
export interface QueryCondition {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: Record<string, unknown>;
}

// Base document interface
export interface BaseDocument {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Firestore service class
export class FirestoreService {
  // Create a new document
  static async create<T extends Record<string, unknown>>(
    collectionName: string,
    data: T
  ) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Create document error:", error);
      throw error;
    }
  }

  // Create a new document with custom ID
  static async createWithId<T extends Record<string, unknown>>(
    collectionName: string,
    id: string,
    data: T
  ) {
    try {
      if (!db) {
        throw new Error('Firestore database instance is not initialized');
      }
      
      const docRef = doc(db, collectionName, id);
      
      await setDoc(docRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return id;
    } catch (error) {
      console.error("Create document with ID error:", error);
      throw error;
    }
  }

  // Get a document by ID
  static async getById(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Get document error:", error);
      throw error;
    }
  }

  // Update a document
  static async update<T extends Record<string, unknown>>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error("Update document error:", error);
      throw error;
    }
  }

  // Delete a document
  static async delete(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Delete document error:", error);
      throw error;
    }
  }

  // Get all documents in a collection
  static async getAll(collectionName: string) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Get all documents error:", error);
      throw error;
    }
  }

  // Query documents with conditions
  static async query(
    collectionName: string,
    conditions: QueryCondition[] = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<DocumentData[]> {
    try {
      const queryConstraints: QueryConstraint[] = [];

      // Add where conditions
      conditions.forEach(condition => {
        queryConstraints.push(where(condition.field, condition.operator, condition.value));
      });

      // Add order by
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }

      // Add limit
      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      const finalQuery = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(finalQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Query documents error:", error);
      throw error;
    }
  }

  // Paginated query
  static async queryPaginated(
    collectionName: string,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    conditions: QueryCondition[] = [],
    orderByField: string = 'createdAt'
  ) {
    try {
      const queryConstraints: QueryConstraint[] = [];

      // Add where conditions
      conditions.forEach(condition => {
        queryConstraints.push(where(condition.field, condition.operator, condition.value));
      });

      // Add order by
      queryConstraints.push(orderBy(orderByField));
      
      // Add pagination
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }
      
      queryConstraints.push(limit(pageSize));

      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);

      return {
        docs: querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Paginated query error:", error);
      throw error;
    }
  }

  // Batch operations
  static async batchWrite(operations: BatchOperation[]): Promise<boolean> {
    try {
      const batch = writeBatch(db);

      operations.forEach(op => {
        if (op.type === 'create' && op.data) {
          const docRef = doc(collection(db, op.collection));
          batch.set(docRef, {
            ...op.data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        } else if (op.type === 'update' && op.id && op.data) {
          const docRef = doc(db, op.collection, op.id);
          batch.update(docRef, {
            ...op.data,
            updatedAt: Timestamp.now(),
          });
        } else if (op.type === 'delete' && op.id) {
          const docRef = doc(db, op.collection, op.id);
          batch.delete(docRef);
        }
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Batch write error:", error);
      throw error;
    }
  }

  // Real-time listener
  static onSnapshot(
    collectionName: string,
    callback: (data: DocumentData[]) => void,
    conditions: QueryCondition[] = []
  ) {
    try {
      const queryConstraints: QueryConstraint[] = [];

      conditions.forEach(condition => {
        queryConstraints.push(where(condition.field, condition.operator, condition.value));
      });

      const q = query(collection(db, collectionName), ...queryConstraints);

      return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(data);
      });
    } catch (error) {
      console.error("Snapshot listener error:", error);
      throw error;
    }
  }
}

export { db };