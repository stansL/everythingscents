import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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

export interface CreateCollectionData {
  name: string;
  description: string;
  category: string;
  tags?: string[];
  image?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateCollectionData extends Partial<CreateCollectionData> {
  id: string;
}

/**
 * Get all collections
 */
export const getAllCollections = async (): Promise<Collection[]> => {
  try {
    const collectionsRef = collection(db, 'collections');
    const q = query(collectionsRef, orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);

    const collections: Collection[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      collections.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'popular',
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
    throw new Error('Failed to fetch collections');
  }
};

/**
 * Get collection by ID
 */
export const getCollectionById = async (id: string): Promise<Collection | null> => {
  try {
    const collectionDoc = doc(db, 'collections', id);
    const snapshot = await getDoc(collectionDoc);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name || '',
      description: data.description || '',
      category: data.category || 'popular',
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
    throw new Error('Failed to fetch collection');
  }
};

/**
 * Create a new collection
 */
export const createCollection = async (data: CreateCollectionData): Promise<string> => {
  try {
    const collectionsRef = collection(db, 'collections');
    const newCollectionRef = doc(collectionsRef);

    const collectionData = {
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      image: data.image || null,
      icon: data.icon || null,
      displayOrder: data.displayOrder || 0,
      productCount: 0, // Initialize to 0
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newCollectionRef, collectionData);
    return newCollectionRef.id;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw new Error('Failed to create collection');
  }
};

/**
 * Update an existing collection
 */
export const updateCollection = async (data: UpdateCollectionData): Promise<void> => {
  try {
    const collectionRef = doc(db, 'collections', data.id);
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    await updateDoc(collectionRef, updateData);
  } catch (error) {
    console.error('Error updating collection:', error);
    throw new Error('Failed to update collection');
  }
};

/**
 * Delete a collection
 */
export const deleteCollection = async (id: string): Promise<void> => {
  try {
    const collectionRef = doc(db, 'collections', id);
    await deleteDoc(collectionRef);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw new Error('Failed to delete collection');
  }
};

/**
 * Update collection product count (called when products are added/removed)
 * This should ideally be done via Cloud Functions, but can be called manually
 */
export const updateCollectionProductCount = async (
  collectionId: string,
  delta: number
): Promise<void> => {
  try {
    const collectionRef = doc(db, 'collections', collectionId);
    await updateDoc(collectionRef, {
      productCount: increment(delta),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating product count for collection ${collectionId}:`, error);
    throw new Error('Failed to update collection product count');
  }
};

/**
 * Recalculate product counts for all collections
 * Useful for fixing count mismatches or initial setup
 */
export const recalculateAllCollectionCounts = async (): Promise<void> => {
  try {
    const collectionsSnapshot = await getDocs(collection(db, 'collections'));
    const productsSnapshot = await getDocs(
      query(collection(db, 'products'), where('isActive', '==', true))
    );

    // Count products per collection
    const collectionCounts = new Map<string, number>();

    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      const productCollections = data.collections || [];

      productCollections.forEach((collectionId: string) => {
        collectionCounts.set(collectionId, (collectionCounts.get(collectionId) || 0) + 1);
      });
    });

    // Update all collection counts in batch
    const batch = writeBatch(db);

    collectionsSnapshot.forEach((doc) => {
      const count = collectionCounts.get(doc.id) || 0;
      const collectionRef = doc.ref;
      batch.update(collectionRef, {
        productCount: count,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log('Successfully recalculated all collection counts');
  } catch (error) {
    console.error('Error recalculating collection counts:', error);
    throw new Error('Failed to recalculate collection counts');
  }
};

/**
 * Recalculate product count for a specific collection
 */
export const recalculateCollectionCount = async (collectionId: string): Promise<number> => {
  try {
    const productsSnapshot = await getDocs(
      query(
        collection(db, 'products'),
        where('collections', 'array-contains', collectionId),
        where('isActive', '==', true)
      )
    );

    const count = productsSnapshot.size;

    // Update the collection document
    const collectionRef = doc(db, 'collections', collectionId);
    await updateDoc(collectionRef, {
      productCount: count,
      updatedAt: serverTimestamp(),
    });

    return count;
  } catch (error) {
    console.error(`Error recalculating count for collection ${collectionId}:`, error);
    throw new Error('Failed to recalculate collection count');
  }
};

/**
 * Get collections by category
 */
export const getCollectionsByCategory = async (category: string): Promise<Collection[]> => {
  try {
    const collectionsRef = collection(db, 'collections');
    const q = query(
      collectionsRef,
      where('category', '==', category),
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
        category: data.category || 'popular',
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
    throw new Error('Failed to fetch collections by category');
  }
};
