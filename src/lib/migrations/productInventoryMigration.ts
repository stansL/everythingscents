/**
 * Migration Script: Add Inventory Management Fields to Existing Products
 * This script updates all existing Product documents in Firestore with new inventory fields
 * Run once during deployment to upgrade the data model
 */

import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../services/products/types';

interface MigrationResult {
  totalProducts: number;
  migratedProducts: number;
  errors: Array<{ productId: string; error: string }>;
}

/**
 * Default values for new inventory fields
 */
const getDefaultInventoryFields = (existingProduct: Partial<Product>) => ({
  // Initialize inventory values based on existing data
  totalCostValue: (existingProduct.stock || 0) * (existingProduct.costPrice || 0),
  totalUnits: existingProduct.stock || 0,
  weightedAverageCost: existingProduct.costPrice || 0,
  lastPurchaseCost: existingProduct.costPrice || 0,
  costHistory: existingProduct.costPrice && existingProduct.costPrice > 0 ? [{
    date: new Date(),
    quantity: existingProduct.stock || 0,
    unitCost: existingProduct.costPrice,
    totalCost: (existingProduct.stock || 0) * existingProduct.costPrice,
    runningAverage: existingProduct.costPrice,
    supplierId: undefined,
    invoiceReference: 'Initial Migration'
  }] : [],
  supplierInfo: undefined,
  reorderPoint: Math.max(Math.floor((existingProduct.stock || 0) * 0.2), 5), // 20% of current stock or minimum 5
  reorderQuantity: Math.max(Math.floor((existingProduct.stock || 0) * 0.5), 10), // 50% of current stock or minimum 10
});

/**
 * Migrate products in batches to avoid timeout
 */
export async function migrateProductsToInventorySystem(
  batchSize: number = 50,
  dryRun: boolean = true
): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalProducts: 0,
    migratedProducts: 0,
    errors: []
  };

  try {
    console.log(`Starting product migration (${dryRun ? 'DRY RUN' : 'LIVE'})...`);
    
    // Get all products
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    result.totalProducts = snapshot.size;
    console.log(`Found ${result.totalProducts} products to migrate`);

    if (snapshot.empty) {
      console.log('No products found to migrate');
      return result;
    }

    // Process in batches
    const products = snapshot.docs;
    const batches = [];
    
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} products)`);

      if (!dryRun) {
        const writeBatchRef = writeBatch(db);
        
        for (const productDoc of batch) {
          try {
            const productData = productDoc.data() as Partial<Product>;
            
            // Skip if already has inventory fields
            if (productData.totalCostValue !== undefined || 
                productData.weightedAverageCost !== undefined) {
              console.log(`Skipping ${productDoc.id} - already migrated`);
              continue;
            }

            const inventoryFields = getDefaultInventoryFields(productData);
            
            // Update document in batch
            writeBatchRef.update(doc(db, 'products', productDoc.id), {
              ...inventoryFields,
              updatedAt: Timestamp.now()
            });
            
            result.migratedProducts++;
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error preparing migration for product ${productDoc.id}:`, errorMessage);
            result.errors.push({
              productId: productDoc.id,
              error: errorMessage
            });
          }
        }

        // Commit the batch
        try {
          await writeBatchRef.commit();
          console.log(`Batch ${batchIndex + 1} committed successfully`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error committing batch ${batchIndex + 1}:`, errorMessage);
          
          // Add errors for all products in failed batch
          batch.forEach(productDoc => {
            result.errors.push({
              productId: productDoc.id,
              error: `Batch commit failed: ${errorMessage}`
            });
          });
        }
        
      } else {
        // Dry run - just log what would be done
        for (const productDoc of batch) {
          const productData = productDoc.data() as Partial<Product>;
          
          if (productData.totalCostValue !== undefined || 
              productData.weightedAverageCost !== undefined) {
            console.log(`[DRY RUN] Would skip ${productDoc.id} - already migrated`);
            continue;
          }

          const inventoryFields = getDefaultInventoryFields(productData);
          console.log(`[DRY RUN] Would migrate product ${productDoc.id}:`, {
            currentStock: productData.stock,
            currentCostPrice: productData.costPrice,
            newFields: inventoryFields
          });
          
          result.migratedProducts++;
        }
      }
      
      // Add delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total products: ${result.totalProducts}`);
    console.log(`Migrated products: ${result.migratedProducts}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach(err => {
        console.log(`Product ${err.productId}: ${err.error}`);
      });
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration failed:', errorMessage);
    throw new Error(`Migration failed: ${errorMessage}`);
  }
}

/**
 * Verify migration results
 */
export async function verifyMigration(): Promise<{
  total: number;
  migrated: number;
  needsMigration: number;
}> {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  let migrated = 0;
  let needsMigration = 0;
  
  snapshot.docs.forEach(doc => {
    const data = doc.data() as Partial<Product>;
    
    if (data.totalCostValue !== undefined && 
        data.weightedAverageCost !== undefined) {
      migrated++;
    } else {
      needsMigration++;
    }
  });
  
  return {
    total: snapshot.size,
    migrated,
    needsMigration
  };
}

/**
 * CLI Helper function for running migration
 */
export async function runProductMigration() {
  console.log('🔄 Starting Product Inventory Migration...\n');
  
  // First, run a dry run to see what would be migrated
  console.log('📋 Running dry run...');
  const dryRunResult = await migrateProductsToInventorySystem(50, true);
  
  if (dryRunResult.errors.length > 0) {
    console.log('❌ Dry run completed with errors. Please review before proceeding.');
    return;
  }
  
  console.log('✅ Dry run completed successfully!');
  console.log(`📊 ${dryRunResult.migratedProducts} products ready for migration\n`);
  
  // Verify current state
  const verificationResult = await verifyMigration();
  console.log('📈 Current State:');
  console.log(`  Total Products: ${verificationResult.total}`);
  console.log(`  Already Migrated: ${verificationResult.migrated}`);
  console.log(`  Need Migration: ${verificationResult.needsMigration}\n`);
  
  if (verificationResult.needsMigration === 0) {
    console.log('🎉 All products are already migrated!');
    return;
  }
  
  // Uncomment the following lines to run the actual migration
  // console.log('🚀 Running actual migration...');
  // const migrationResult = await migrateProductsToInventorySystem(50, false);
  // console.log('✅ Migration completed!');
  
  console.log('\n⚠️  To run the actual migration, uncomment the lines in runProductMigration()');
}