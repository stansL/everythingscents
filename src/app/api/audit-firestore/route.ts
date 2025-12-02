import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, getCountFromServer, query, limit } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const collections = [
      'products',
      'categories',
      'orders',
      'users',
      'invoices',
      'payments',
      'inventoryTransactions'
    ];

    const results = [];

    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getCountFromServer(collectionRef);
        const count = snapshot.data().count;

        let sampleDoc = null;
        if (count > 0) {
          const sampleQuery = query(collectionRef, limit(1));
          const sampleSnapshot = await getDocs(sampleQuery);
          sampleDoc = sampleSnapshot.docs[0]?.data();
        }

        results.push({
          collection: collectionName,
          count,
          status: count > 0 ? 'success' : 'empty',
          sampleFields: sampleDoc ? Object.keys(sampleDoc) : []
        });
      } catch (error: any) {
        results.push({
          collection: collectionName,
          count: 0,
          status: 'error',
          error: error.message
        });
      }
    }

    // Detailed product analysis
    let productStats = null;
    const productResult = results.find(r => r.collection === 'products');
    
    if (productResult && productResult.count > 0) {
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      productStats = {
        total: products.length,
        active: products.filter((p: any) => p.isActive === true).length,
        featured: products.filter((p: any) => p.isFeatured === true).length,
        inStock: products.filter((p: any) => p.stock > 0).length,
        withImages: products.filter((p: any) => p.images && p.images.length > 0).length
      };
    }

    const hasProducts = results.find(r => r.collection === 'products')?.count! > 0;
    const hasCategories = results.find(r => r.collection === 'categories')?.count! > 0;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      productStats,
      readiness: {
        hasProducts,
        hasCategories,
        ready: hasProducts && hasCategories
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
