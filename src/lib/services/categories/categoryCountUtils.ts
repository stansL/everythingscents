/**
 * Category Count Utilities
 * Automatically maintain accurate product counts in categories
 */

import { doc, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';

/**
 * Increment product count for a category
 */
async function incrementCategoryCount(categoryId: string, batch?: ReturnType<typeof writeBatch>) {
  const useBatch = batch || writeBatch(db);
  const categoryRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  
  useBatch.update(categoryRef, {
    productCount: increment(1),
  });
  
  if (!batch) {
    await useBatch.commit();
  }
}

/**
 * Decrement product count for a category
 */
async function decrementCategoryCount(categoryId: string, batch?: ReturnType<typeof writeBatch>) {
  const useBatch = batch || writeBatch(db);
  const categoryRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  
  useBatch.update(categoryRef, {
    productCount: increment(-1),
  });
  
  if (!batch) {
    await useBatch.commit();
  }
}

/**
 * Update category counts when a product is created
 * Increments count for both parent category and subcategory
 */
export async function incrementProductCountsForCategories(
  categoryId: string,
  subcategoryId?: string
): Promise<void> {
  const batch = writeBatch(db);
  
  if (categoryId) {
    await incrementCategoryCount(categoryId, batch);
  }
  
  if (subcategoryId) {
    await incrementCategoryCount(subcategoryId, batch);
  }
  
  await batch.commit();
}

/**
 * Update category counts when a product is deleted
 * Decrements count for both parent category and subcategory
 */
export async function decrementProductCountsForCategories(
  categoryId: string,
  subcategoryId?: string
): Promise<void> {
  const batch = writeBatch(db);
  
  if (categoryId) {
    await decrementCategoryCount(categoryId, batch);
  }
  
  if (subcategoryId) {
    await decrementCategoryCount(subcategoryId, batch);
  }
  
  await batch.commit();
}

/**
 * Update category counts when a product's categories change
 * Handles moving products between categories
 */
export async function updateProductCountsForCategoryChange(
  oldCategoryId: string | undefined,
  newCategoryId: string | undefined,
  oldSubcategoryId: string | undefined,
  newSubcategoryId: string | undefined
): Promise<void> {
  const batch = writeBatch(db);
  
  // Handle parent category changes
  if (oldCategoryId !== newCategoryId) {
    if (oldCategoryId) {
      await decrementCategoryCount(oldCategoryId, batch);
    }
    if (newCategoryId) {
      await incrementCategoryCount(newCategoryId, batch);
    }
  }
  
  // Handle subcategory changes
  if (oldSubcategoryId !== newSubcategoryId) {
    if (oldSubcategoryId) {
      await decrementCategoryCount(oldSubcategoryId, batch);
    }
    if (newSubcategoryId) {
      await incrementCategoryCount(newSubcategoryId, batch);
    }
  }
  
  await batch.commit();
}

/**
 * Update category counts when a product's active status changes
 */
export async function updateProductCountsForStatusChange(
  categoryId: string,
  subcategoryId: string | undefined,
  wasActive: boolean,
  isActive: boolean
): Promise<void> {
  // Only update if status actually changed
  if (wasActive === isActive) {
    return;
  }
  
  const batch = writeBatch(db);
  
  if (isActive) {
    // Product became active, increment counts
    if (categoryId) {
      await incrementCategoryCount(categoryId, batch);
    }
    if (subcategoryId) {
      await incrementCategoryCount(subcategoryId, batch);
    }
  } else {
    // Product became inactive, decrement counts
    if (categoryId) {
      await decrementCategoryCount(categoryId, batch);
    }
    if (subcategoryId) {
      await decrementCategoryCount(subcategoryId, batch);
    }
  }
  
  await batch.commit();
}
