"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductService, Product } from "@/lib";
import React, { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || "Failed to load products");
      }
    } catch (err) {
      setError("An error occurred while loading products");
    } finally {
      setLoading(false);
    }
  };

  const addSampleProduct = async () => {
    try {
      const sampleProduct = {
        name: "Lavender Dreams Perfume",
        description: "A calming lavender-based fragrance perfect for evening wear",
        price: 89.99,
        sku: `LAV-${Date.now()}`,
        categoryId: "perfumes",
        brand: "Everything Scents",
        images: ["/images/product/lavender-perfume.jpg"],
        stock: 25,
        minStock: 5,
        tags: ["lavender", "floral", "evening", "calming"],
        isActive: true,
        isFeatured: true,
        scentProfile: {
          topNotes: ["Bergamot", "Lemon"],
          middleNotes: ["Lavender", "Rose"],
          baseNotes: ["Sandalwood", "Musk"]
        },
        scentType: "perfume" as const,
        size: "50ml",
        gender: "unisex" as const,
        season: "year-round" as const,
        longevity: "long-lasting" as const,
        sillage: "moderate" as const,
      };

      const response = await ProductService.createProduct(sampleProduct);
      if (response.success) {
        await loadProducts(); // Refresh the list
        alert("Sample product added successfully!");
      } else {
        alert(response.error || "Failed to add product");
      }
    } catch {
      alert("An error occurred while adding the product");
    }
  };
  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Products" />
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Products" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mb-6">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Products Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Manage your product inventory here. Connected to Firebase Firestore.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-4">
          <button 
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Products
          </button>
          <button 
            onClick={addSampleProduct}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Add Sample Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No products found. Add some products to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="p-6 border border-gray-200 rounded-lg dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}