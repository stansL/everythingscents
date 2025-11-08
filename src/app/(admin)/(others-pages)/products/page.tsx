"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductService, Product } from "@/lib";
import React, { useEffect, useState } from "react";
import ProductsTable from "@/components/products/ProductsTable";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    brand: "",
    category: "",
    isActive: "all",
    isFeatured: "all"
  });
  const [lastDoc, setLastDoc] = useState<unknown>(null);
  const [, setHasMore] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadProducts(true);
  }, [currentPage, searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async (reset = false) => {
    try {
      setLoading(true);
      let response;

      if (searchTerm) {
        response = await ProductService.searchProducts(searchTerm);
        if (response.success && response.data) {
          setProducts(response.data);
          setTotalPages(Math.ceil(response.data.length / pageSize));
          setHasMore(false);
        }
      } else {
        const productFilter = {
          ...(filters.brand && { brand: filters.brand }),
          ...(filters.category && { categoryId: filters.category }),
          ...(filters.isActive !== "all" && { isActive: filters.isActive === "true" }),
          ...(filters.isFeatured !== "all" && { isFeatured: filters.isFeatured === "true" })
        };

        response = await ProductService.getProductsPaginated(
          pageSize,
          reset ? undefined : lastDoc,
          Object.keys(productFilter).length > 0 ? productFilter : undefined
        );

        if (response.success && response.data) {
          setProducts(response.data.data);
          setHasMore(response.data.hasMore);
          setLastDoc(response.data.lastDoc);
          // For pagination, we'll estimate total pages based on current data
          // In a real implementation, you might want to get total count separately
          setTotalPages(currentPage + (response.data.hasMore ? 1 : 0));
        }
      }

      if (!response.success) {
        setError(response.error || "Failed to load products");
      }
    } catch {
      setError("An error occurred while loading products");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadProducts(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const addSampleProduct = async () => {
    try {
      const sampleProducts = [
        {
          name: "Lavender Dreams Perfume",
          description: "A calming lavender-based fragrance perfect for evening wear",
          price: 89.99,
          sku: `LAV-${Date.now()}`,
          categoryId: "perfumes",
          brand: "Everything Scents",
          images: ["/images/product/product-01.jpg"],
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
        },
        {
          name: "Ocean Breeze Cologne",
          description: "Fresh aquatic fragrance with marine and citrus notes",
          price: 65.99,
          salePrice: 49.99,
          sku: `OCN-${Date.now() + 1}`,
          categoryId: "colognes",
          brand: "Everything Scents",
          images: ["/images/product/product-02.jpg"],
          stock: 15,
          minStock: 10,
          tags: ["ocean", "fresh", "citrus", "summer"],
          isActive: true,
          isFeatured: false,
          scentProfile: {
            topNotes: ["Lemon", "Sea Salt", "Bergamot"],
            middleNotes: ["Marine Accord", "Jasmine"],
            baseNotes: ["White Musk", "Cedar"]
          },
          scentType: "cologne" as const,
          size: "100ml",
          gender: "men" as const,
          season: "summer" as const,
          longevity: "moderate" as const,
          sillage: "moderate" as const,
        },
        {
          name: "Vanilla Sunset Candle",
          description: "Warm vanilla candle with amber and sandalwood undertones",
          price: 34.99,
          sku: `VAN-${Date.now() + 2}`,
          categoryId: "candles",
          brand: "Everything Scents",
          images: ["/images/product/product-03.jpg"],
          stock: 3,
          minStock: 5,
          tags: ["vanilla", "candle", "warm", "cozy"],
          isActive: true,
          isFeatured: true,
          scentProfile: {
            topNotes: ["Vanilla Bean"],
            middleNotes: ["Amber", "Honey"],
            baseNotes: ["Sandalwood", "Musk"]
          },
          scentType: "candle" as const,
          size: "8oz",
          gender: "unisex" as const,
          season: "fall" as const,
          longevity: "long-lasting" as const,
          sillage: "strong" as const,
        }
      ];

      // Add one random sample product
      const randomIndex = Math.floor(Math.random() * sampleProducts.length);
      const sampleProduct = sampleProducts[randomIndex];

      const response = await ProductService.createProduct(sampleProduct);
      if (response.success) {
        await loadProducts(true); // Refresh the list
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

        <ProductsTable
          products={products}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          searchTerm={searchTerm}
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
          onAddProduct={addSampleProduct}
          onProductUpdate={() => loadProducts(true)}
        />
      </div>
    </div>
  );
}