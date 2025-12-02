import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';

export interface Collection {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  image?: string;
  icon?: string;
  displayOrder: number;
  productCount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collectionsRef = collection(db, 'collections');

/**
 * Get all collections
 */
export const getAllCollections = async (): Promise<Collection[]> => {
  try {
    const q = query(collectionsRef, orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    
    const collections: Collection[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      collections.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'other',
        tags: data.tags || [],
        image: data.image,
        icon: data.icon,
        displayOrder: data.displayOrder || 0,
        productCount: data.productCount || 0,
        isActive: data.isActive !== false,
        isFeatured: data.isFeatured || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    
    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
};

/**
 * Get collection by ID
 */
export const getCollectionById = async (collectionId: string): Promise<Collection | null> => {
  try {
    const docRef = doc(collectionsRef, collectionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      description: data.description || '',
      category: data.category || 'other',
      tags: data.tags || [],
      image: data.image,
      icon: data.icon,
      displayOrder: data.displayOrder || 0,
      productCount: data.productCount || 0,
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
};

/**
 * Create a new collection
 */
export const createCollection = async (
  collectionData: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collectionsRef, {
      ...collectionData,
      productCount: 0, // Initialize with 0
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

/**
 * Update an existing collection
 */
export const updateCollection = async (
  collectionId: string,
  updates: Partial<Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(collectionsRef, collectionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
};

/**
 * Delete a collection
 */
export const deleteCollection = async (collectionId: string): Promise<void> => {
  try {
    const docRef = doc(collectionsRef, collectionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

/**
 * Get collections by category
 */
export const getCollectionsByCategory = async (category: string): Promise<Collection[]> => {
  try {
    const q = query(
      collectionsRef,
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
    const snapshot = await getDocs(q);
    
    const collections: Collection[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      collections.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'other',
        tags: data.tags || [],
        image: data.image,
        icon: data.icon,
        displayOrder: data.displayOrder || 0,
        productCount: data.productCount || 0,
        isActive: data.isActive !== false,
        isFeatured: data.isFeatured || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    
    return collections;
  } catch (error) {
    console.error('Error fetching collections by category:', error);
    return [];
  }
};

/**
 * Update collection product count
 */
export const updateCollectionProductCount = async (
  collectionId: string,
  count?: number
): Promise<number> => {
  try {
    let productCount = count;
    
    // If count not provided, calculate it
    if (productCount === undefined) {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('collections', 'array-contains', collectionId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      productCount = snapshot.size;
    }
    
    const docRef = doc(collectionsRef, collectionId);
    await updateDoc(docRef, {
      productCount,
      updatedAt: Timestamp.now(),
    });
    
    return productCount;
  } catch (error) {
    console.error('Error updating collection product count:', error);
    throw error;
  }
};
