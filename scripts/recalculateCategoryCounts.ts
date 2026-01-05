import * as admin from 'firebase-admin';

// Initialize Firebase Admin (uses Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS env var)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'esapp-a04fa',
  });
}

const db = admin.firestore();

/**
 * Get count of active products in a specific category (as parent category)
 */
async function getCategoryProductCount(categoryId: string): Promise<number> {
  try {
    const productsRef = db.collection('products');
    const snapshot = await productsRef
      .where('categoryId', '==', categoryId)
      .where('isActive', '==', true)
      .count()
      .get();
    
    return snapshot.data().count;
  } catch (error) {
    console.error(`Error getting count for category ${categoryId}:`, error);
    return 0;
  }
}

/**
 * Get count of active products in a specific subcategory
 */
async function getSubcategoryProductCount(subcategoryId: string): Promise<number> {
  try {
    const productsRef = db.collection('products');
    const snapshot = await productsRef
      .where('subcategoryId', '==', subcategoryId)
      .where('isActive', '==', true)
      .count()
      .get();
    
    return snapshot.data().count;
  } catch (error) {
    console.error(`Error getting count for subcategory ${subcategoryId}:`, error);
    return 0;
  }
}

/**
 * Recalculate product counts for all categories
 */
async function recalculateAllCategoryCounts() {
  console.log('🔄 Starting category count recalculation...\n');
  
  const categoriesRef = db.collection('categories');
  const snapshot = await categoriesRef.get();
  
  let updated = 0;
  let failed = 0;
  let totalProducts = 0;
  
  for (const docSnap of snapshot.docs) {
    const categoryId = docSnap.id;
    const categoryData = docSnap.data();
    const categoryName = categoryData.name || categoryId;
    const parentId = categoryData.parentId;
    
    try {
      // For subcategories (has parentId), count products with this subcategoryId
      // For parent categories (no parentId), count products with this categoryId
      let count: number;
      
      if (parentId) {
        // This is a subcategory
        count = await getSubcategoryProductCount(categoryId);
      } else {
        // This is a parent category
        count = await getCategoryProductCount(categoryId);
      }
      
      await categoriesRef.doc(categoryId).update({
        productCount: count,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      
      const categoryType = parentId ? '  ↳ Subcategory' : 'Category';
      console.log(`✅ ${categoryType}: ${categoryName}: ${count} products`);
      updated++;
      totalProducts += count;
    } catch (error) {
      console.error(`❌ Failed to update ${categoryName}:`, error);
      failed++;
    }
  }
  
  console.log('\n📊 Recalculation Summary:');
  console.log(`   ✅ Categories updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total categories: ${snapshot.size}`);
  console.log(`   🛍️  Total products counted: ${totalProducts}`);
  console.log('\n✨ Category counts recalculated!');
}

// Run the recalculation
recalculateAllCategoryCounts()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
