import { db } from '../lib/firebase';
import { collection, doc, updateDoc, getDoc, increment, Timestamp } from 'firebase/firestore';

/**
 * Update collection counts when a product is created, updated, or deleted
 * This function handles the difference between old and new collection assignments
 */
export async function updateCollectionCounts(
  productId: string,
  oldCollections: string[] = [],
  newCollections: string[] = [],
  isActive: boolean = true
): Promise<void> {
  try {
    const collectionsRef = collection(db, 'collections');
    
    // If product is inactive, treat newCollections as empty
    const effectiveNewCollections = isActive ? newCollections : [];
    
    // Find collections to add (in new but not in old)
    const collectionsToAdd = effectiveNewCollections.filter(c => !oldCollections.includes(c));
    
    // Find collections to remove (in old but not in new, or product is now inactive)
    const collectionsToRemove = oldCollections.filter(c => !effectiveNewCollections.includes(c));
    
    const updatePromises: Promise<void>[] = [];
    
    // Increment counts for added collections
    for (const collectionId of collectionsToAdd) {
      const docRef = doc(collectionsRef, collectionId);
      updatePromises.push(
        updateDoc(docRef, {
          productCount: increment(1),
          updatedAt: Timestamp.now(),
        }).catch((error) => {
          console.error(`Error incrementing count for collection ${collectionId}:`, error);
        })
      );
    }
    
    // Decrement counts for removed collections
    for (const collectionId of collectionsToRemove) {
      const docRef = doc(collectionsRef, collectionId);
      updatePromises.push(
        updateDoc(docRef, {
          productCount: increment(-1),
          updatedAt: Timestamp.now(),
        }).catch((error) => {
          console.error(`Error decrementing count for collection ${collectionId}:`, error);
        })
      );
    }
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating collection counts:', error);
    throw error;
  }
}

/**
 * Get current collections for a product
 */
export async function getProductCollections(productId: string): Promise<string[]> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      return [];
    }
    
    return productSnap.data().collections || [];
  } catch (error) {
    console.error('Error getting product collections:', error);
    return [];
  }
}

/**
 * Helper function to call when creating a new product
 */
export async function handleProductCreate(
  productId: string,
  collections: string[],
  isActive: boolean
): Promise<void> {
  await updateCollectionCounts(productId, [], collections, isActive);
}

/**
 * Helper function to call when updating a product
 */
export async function handleProductUpdate(
  productId: string,
  oldCollections: string[],
  newCollections: string[],
  isActive: boolean
): Promise<void> {
  await updateCollectionCounts(productId, oldCollections, newCollections, isActive);
}

/**
 * Helper function to call when deleting a product
 */
export async function handleProductDelete(
  productId: string,
  collections: string[]
): Promise<void> {
  await updateCollectionCounts(productId, collections, [], false);
}
