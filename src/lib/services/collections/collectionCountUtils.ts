/**
 * Collection Count Management Utilities
 * 
 * These utilities help maintain accurate product counts in collections
 * when products are created, updated, or deleted.
 * 
 * IMPORTANT: For production, these should ideally be Cloud Functions triggers.
 * For now, they can be called manually from admin operations.
 */

import {
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Update collection counts when a product is created
 * Increments the productCount for each collection the product belongs to
 */
export const incrementCollectionCounts = async (collectionIds: string[]): Promise<void> => {
  if (!collectionIds || collectionIds.length === 0) return;

  try {
    const batch = writeBatch(db);

    for (const collectionId of collectionIds) {
      const collectionRef = doc(db, 'collections', collectionId);
      batch.update(collectionRef, {
        productCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`✅ Incremented counts for collections: ${collectionIds.join(', ')}`);
  } catch (error) {
    console.error('Error incrementing collection counts:', error);
    throw error;
  }
};

/**
 * Update collection counts when a product is deleted
 * Decrements the productCount for each collection the product belonged to
 */
export const decrementCollectionCounts = async (collectionIds: string[]): Promise<void> => {
  if (!collectionIds || collectionIds.length === 0) return;

  try {
    const batch = writeBatch(db);

    for (const collectionId of collectionIds) {
      const collectionRef = doc(db, 'collections', collectionId);
      batch.update(collectionRef, {
        productCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`✅ Decremented counts for collections: ${collectionIds.join(', ')}`);
  } catch (error) {
    console.error('Error decrementing collection counts:', error);
    throw error;
  }
};

/**
 * Update collection counts when a product's collections are changed
 * Handles both additions and removals efficiently
 */
export const updateCollectionCountsOnProductEdit = async (
  oldCollectionIds: string[],
  newCollectionIds: string[]
): Promise<void> => {
  const oldSet = new Set(oldCollectionIds || []);
  const newSet = new Set(newCollectionIds || []);

  // Collections to increment (newly added)
  const toIncrement = newCollectionIds.filter((id) => !oldSet.has(id));

  // Collections to decrement (removed)
  const toDecrement = oldCollectionIds.filter((id) => !newSet.has(id));

  try {
    const batch = writeBatch(db);

    // Increment counts for newly added collections
    for (const collectionId of toIncrement) {
      const collectionRef = doc(db, 'collections', collectionId);
      batch.update(collectionRef, {
        productCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    // Decrement counts for removed collections
    for (const collectionId of toDecrement) {
      const collectionRef = doc(db, 'collections', collectionId);
      batch.update(collectionRef, {
        productCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }

    if (toIncrement.length > 0 || toDecrement.length > 0) {
      await batch.commit();
      console.log(`✅ Updated collection counts:`);
      if (toIncrement.length > 0) console.log(`   + Added to: ${toIncrement.join(', ')}`);
      if (toDecrement.length > 0) console.log(`   - Removed from: ${toDecrement.join(', ')}`);
    }
  } catch (error) {
    console.error('Error updating collection counts on product edit:', error);
    throw error;
  }
};

/**
 * Recalculate all collection counts from scratch
 * Useful for fixing inconsistencies or initial setup
 */
export const recalculateAllCollectionCounts = async (): Promise<void> => {
  try {
    console.log('🔄 Recalculating all collection counts...\n');

    // Get all collections
    const collectionsSnapshot = await getDocs(collection(db, 'collections'));

    // Get all active products
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

    // Update all collection counts in batches (Firestore batch limit is 500)
    const batch = writeBatch(db);
    let operationCount = 0;

    collectionsSnapshot.forEach((doc) => {
      const count = collectionCounts.get(doc.id) || 0;
      batch.update(doc.ref, {
        productCount: count,
        updatedAt: serverTimestamp(),
      });
      operationCount++;
      console.log(`  ${doc.data().name}: ${count} products`);
    });

    await batch.commit();
    console.log(`\n✅ Successfully recalculated counts for ${operationCount} collections`);
  } catch (error) {
    console.error('❌ Error recalculating collection counts:', error);
    throw error;
  }
};

/**
 * Recalculate count for a specific collection
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

    console.log(`✅ Collection ${collectionId}: ${count} products`);
    return count;
  } catch (error) {
    console.error(`❌ Error recalculating count for collection ${collectionId}:`, error);
    throw error;
  }
};

/**
 * Helper to integrate with product creation
 * Call this in your createProduct function
 */
export const onProductCreated = async (productData: {
  collections?: string[];
  isActive: boolean;
}): Promise<void> => {
  if (productData.isActive && productData.collections) {
    await incrementCollectionCounts(productData.collections);
  }
};

/**
 * Helper to integrate with product updates
 * Call this in your updateProduct function
 */
export const onProductUpdated = async (
  oldData: { collections?: string[]; isActive: boolean },
  newData: { collections?: string[]; isActive: boolean }
): Promise<void> => {
  // If product was active and is now inactive, decrement all its collections
  if (oldData.isActive && !newData.isActive) {
    await decrementCollectionCounts(oldData.collections || []);
    return;
  }

  // If product was inactive and is now active, increment all its collections
  if (!oldData.isActive && newData.isActive) {
    await incrementCollectionCounts(newData.collections || []);
    return;
  }

  // If product is active and collections changed
  if (newData.isActive) {
    await updateCollectionCountsOnProductEdit(
      oldData.collections || [],
      newData.collections || []
    );
  }
};

/**
 * Helper to integrate with product deletion
 * Call this in your deleteProduct function
 */
export const onProductDeleted = async (productData: {
  collections?: string[];
  isActive: boolean;
}): Promise<void> => {
  if (productData.isActive && productData.collections) {
    await decrementCollectionCounts(productData.collections);
  }
};
