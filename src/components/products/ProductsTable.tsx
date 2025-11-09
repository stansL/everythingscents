"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import ProductViewModal from "./ProductViewModal";
import ProductDeleteModal from "./ProductDeleteModal";
import ProductFilters from "./ProductFilters";
import ProductImage from "./ProductImage";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  filters: {
    brand: string;
    category: string;
    isActive: string;
    isFeatured: string;
  };
  onSearch: (term: string) => void;
  onFilterChange: (filters: {
    brand: string;
    category: string;
    isActive: string;
    isFeatured: string;
  }) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onAddProduct: () => void;
  onProductUpdate: () => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading,
  currentPage,
  totalPages,
  searchTerm,
  filters,
  onSearch,
  onFilterChange,
  onPageChange,
  onRefresh,
  onAddProduct,
  onProductUpdate,
}) => {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalType, setModalType] = useState<'view' | 'delete' | null>(null);

  const handleModalOpen = (product: Product, type: 'view' | 'delete') => {
    setSelectedProduct(product);
    setModalType(type);
  };

  const handleModalClose = () => {
    setSelectedProduct(null);
    setModalType(null);
  };

  const formatPrice = (price: number, salePrice?: number) => {
    if (salePrice && salePrice < price) {
      return (
        <div className="flex flex-col">
          <span className="text-sm line-through text-gray-500">${price.toFixed(2)}</span>
          <span className="text-sm font-medium text-red-600">${salePrice.toFixed(2)}</span>
        </div>
      );
    }
    return <span className="text-sm font-medium">${price.toFixed(2)}</span>;
  };

  const getStockStatus = (stock: number, minStock?: number) => {
    if (stock === 0) {
      return <Badge color="error">Out of Stock</Badge>;
    }
    if (minStock && stock <= minStock) {
      return <Badge color="warning">Low Stock</Badge>;
    }
    return <Badge color="success">In Stock</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Title and Buttons on same line */}
      <div className="mb-6">
        {/* Title and Action Buttons on same line */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products List
          </h2>
          
          {/* Action Buttons - Right aligned with title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {/* Export functionality */}}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={onAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        </div>
        
        {/* Description below title */}
        <p className="text-gray-600 dark:text-gray-400">Track your store&apos;s progress to boost your sales.</p>
      </div>

      {/* Filters */}
      <ProductFilters
        searchTerm={searchTerm}
        filters={filters}
        onSearch={onSearch}
        onFilterChange={onFilterChange}
      />

      {/* Table - TailAdmin Style */}
      {products.length === 0 ? (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No products found. Add some products to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-2 text-left dark:bg-meta-4">
                  <TableCell isHeader className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Product</TableCell>
                  <TableCell isHeader className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Category</TableCell>
                  <TableCell isHeader className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Brand</TableCell>
                  <TableCell isHeader className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Price</TableCell>
                  <TableCell isHeader className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Stock</TableCell>
                  <TableCell isHeader className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Status</TableCell>
                  <TableCell isHeader className="py-4 px-4 font-medium text-black dark:text-white">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="border-b border-stroke dark:border-strokedark">
                    <TableCell className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <div className="flex items-center gap-3">
                        <div className="h-12.5 w-15 rounded-md">
                          <ProductImage
                            src={product.images?.[0]}
                            alt={product.name}
                            width={60}
                            height={50}
                            className="object-cover w-full h-full rounded-md"
                            fallbackClassName="w-15 h-12.5 rounded-md"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <h5 className="font-medium text-black dark:text-white">
                            {product.name}
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {product.sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {product.categoryId}
                      </p>
                    </TableCell>
                    <TableCell className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {product.brand}
                      </p>
                    </TableCell>
                    <TableCell className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {formatPrice(product.price, product.salePrice)}
                      </p>
                    </TableCell>
                    <TableCell className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-black dark:text-white">{product.stock}</span>
                        {getStockStatus(product.stock, product.minStock)}
                      </div>
                    </TableCell>
                    <TableCell className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                        (product.status === 'published' || (!product.status && product.isActive))
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : product.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : product.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          : (product.status === 'retired' || (!product.status && !product.isActive))
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {product.status === 'published' ? 'Published' : 
                         product.status === 'draft' ? 'Draft' :
                         product.status === 'inactive' ? 'Inactive' : 
                         product.status === 'retired' ? 'Retired' :
                         // Backward compatibility: if no status field, use isActive
                         (!product.status && product.isActive) ? 'Active (Legacy)' : 'Inactive (Legacy)'}
                      </p>
                    </TableCell>
                    <TableCell className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <button 
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="hover:text-primary"
                          title="View/Edit Product"
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.2656 8.99981 13.2656C13.1061 13.2656 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.73436 8.99981 4.73436C4.89356 4.73436 2.4748 7.95936 1.85605 8.99999Z"
                              fill=""
                            />
                            <path
                              d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 8.10938C8.51562 8.10938 8.10938 8.51562 8.10938 9C8.10938 9.48438 8.51562 9.89063 9 9.89063C9.48438 9.89063 9.89062 9.48438 9.89062 9C9.89062 8.51562 9.48438 8.10938 9 8.10938Z"
                              fill=""
                            />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleModalOpen(product, 'delete')}
                          className="hover:text-primary"
                          title="Delete Product"
                        >
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2969H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                              fill=""
                            />
                            <path
                              d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                              fill=""
                            />
                            <path
                              d="M11.2502 9.67504C10.8846 9.64692 10.6033 9.90004 10.5752 10.2657L10.4064 12.7407C10.3783 13.0782 10.6314 13.3875 10.9971 13.4157C11.0252 13.4157 11.0252 13.4157 11.0533 13.4157C11.3908 13.4157 11.6721 13.1625 11.6721 12.825L11.8408 10.35C11.8408 9.98442 11.5877 9.70317 11.2502 9.67504Z"
                              fill=""
                            />
                            <path
                              d="M6.72245 9.67504C6.38495 9.70317 6.1037 10.0125 6.13182 10.35L6.3287 12.825C6.35683 13.1625 6.63808 13.4157 6.94745 13.4157C6.97558 13.4157 6.97558 13.4157 7.0037 13.4157C7.34120 13.3875 7.62245 13.0782 7.59433 12.7407L7.39745 10.2657C7.39745 9.90004 7.08808 9.64692 6.72245 9.67504Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {/* Pagination and Stats - TailAdmin Style */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
        <div className="text-sm text-gray-700 dark:text-gray-400">
          Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, products.length)} of {products.length} products
        </div>
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {/* Modals */}
      {selectedProduct && modalType === 'view' && (
        <ProductViewModal
          isOpen={true}
          onClose={handleModalClose}
          product={selectedProduct}
        />
      )}

      {selectedProduct && modalType === 'delete' && (
        <ProductDeleteModal
          isOpen={true}
          onClose={handleModalClose}
          product={selectedProduct}
          onProductUpdate={onProductUpdate}
        />
      )}
    </div>
  );
};

export default ProductsTable;