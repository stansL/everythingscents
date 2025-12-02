"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductService, Product, ProductStatus } from "@/lib";
import React, { useEffect, useState } from "react";
import ProductsTable from "@/components/products/ProductsTable";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    brand: "",
    category: "",
    subcategory: "",
    isActive: "all",
    isFeatured: "all"
  });
  const [lastDoc, setLastDoc] = useState<unknown>(null);
  const [, setHasMore] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const pageSize = 10;

  useEffect(() => {
    loadAllProducts();
  }, [searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Update displayed products when page changes
    if (allProducts.length > 0) {
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      setProducts(allProducts.slice(startIdx, endIdx));
    }
  }, [currentPage, allProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setCurrentPage(1); // Reset to page 1 when filters change
      let response;

      if (searchTerm) {
        response = await ProductService.searchProducts(searchTerm);
      } else {
        const productFilter = {
          ...(filters.brand && { brand: filters.brand }),
          ...(filters.category && { categoryId: filters.category }),
          ...(filters.subcategory && { subcategoryId: filters.subcategory }),
          ...(filters.isActive !== "all" && { status: filters.isActive as ProductStatus }),
          ...(filters.isFeatured !== "all" && { isFeatured: filters.isFeatured === "true" })
        };

        response = await ProductService.getProducts(
          Object.keys(productFilter).length > 0 ? productFilter : undefined
        );
      }

      if (response.success && response.data) {
        setAllProducts(response.data);
        setTotalCount(response.data.length);
        setTotalPages(Math.ceil(response.data.length / pageSize));
        
        // Set first page of products
        setProducts(response.data.slice(0, pageSize));
      } else {
        setError(response.error || "Failed to load products");
        setAllProducts([]);
        setProducts([]);
      }
    } catch (err) {
      setError("An error occurred while loading products");
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAllProducts();
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



  const handleAddProduct = () => {
    router.push('/add-product');
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
      <PageBreadcrumb pageTitle="Products Management" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
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
          totalCount={totalCount}
          searchTerm={searchTerm}
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
          onAddProduct={handleAddProduct}
          onProductUpdate={() => loadAllProducts()}
        />
      </div>
    </div>
  );
}