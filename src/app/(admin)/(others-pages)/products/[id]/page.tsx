"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductService, Product, ProductStatus } from "@/lib";
import { ProductDeleteModal } from "@/components/products";
import { useModal } from "@/hooks/useModal";

export default function ViewEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProductById(productId);
      
      if (response.success && response.data) {
        setProduct(response.data);
        setFormData(response.data);
      } else {
        setError(response.error || "Product not found");
      }
    } catch (err) {
      setError("Failed to load product");
      console.error("Error loading product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - revert changes
      setFormData(product || {});
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveChanges = async () => {
    if (!product || !formData || !product.id) return;

    try {
      setIsSaving(true);
      const response = await ProductService.updateProduct(product.id, formData);
      
      if (response.success) {
        setProduct({ ...product, ...formData });
        setIsEditMode(false);
        // You could show a success message here
      } else {
        setError(response.error || "Failed to update product");
      }
    } catch (err) {
      setError("An error occurred while updating the product");
      console.error("Error updating product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!product || !product.id) return;
    openDeleteModal();
  };

  const handleDeleteSuccess = () => {
    closeDeleteModal();
    router.push('/products?message=Product deleted successfully');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (newStatus: ProductStatus) => {
    const isActive = newStatus === 'published';
    setFormData(prev => ({ 
      ...prev, 
      status: newStatus,
      isActive 
    }));
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Loading Product..." />
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Product Not Found" />
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageBreadcrumb 
        pageTitle={isEditMode ? `Edit ${product.name}` : product.name} 
      />
      
      {error && (
        <div className="mb-6 p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/products')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Products
            </button>
            <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode ? "Editing Mode" : "View Mode"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditMode ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Product
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Product
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <form className="space-y-8">
            
            {/* Status Management Section */}
            {isEditMode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Product Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Status
                    </label>
                    <select
                      value={formData?.status || 'draft'}
                      onChange={(e) => handleStatusChange(e.target.value as ProductStatus)}
                      className="w-full px-4 py-3 rounded-xl border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="draft">Draft - Work in progress</option>
                      <option value="published">Published - Live for customers</option>
                      <option value="inactive">Inactive - Temporarily disabled</option>
                      <option value="retired">Retired - Permanently discontinued</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Visibility
                    </label>
                    <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                      formData?.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {formData?.isActive ? '✓ Visible to customers' : '✗ Hidden from customers'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Description Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Product Information
                </h3>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Basic Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name *
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="name"
                        value={formData?.name || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter product name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SKU
                    </label>
                    <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400">
                      {product.sku}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  {isEditMode ? (
                    <textarea
                      name="description"
                      value={formData?.description || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Enter product description"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white whitespace-pre-wrap">
                      {product.description}
                    </div>
                  )}
                </div>

                {/* Category, Brand, Size Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="categoryId"
                        value={formData?.categoryId || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.categoryId}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand *
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="brand"
                        value={formData?.brand || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.brand}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Size *
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="size"
                        value={formData?.size || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.size}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gender, Scent Type, Season Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    {isEditMode ? (
                      <select
                        name="gender"
                        value={formData?.gender || 'unisex'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white capitalize">
                        {product.gender}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scent Type
                    </label>
                    {isEditMode ? (
                      <select
                        name="scentType"
                        value={formData?.scentType || 'perfume'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="perfume">Perfume</option>
                        <option value="cologne">Cologne</option>
                        <option value="body-spray">Body Spray</option>
                        <option value="candle">Candle</option>
                        <option value="diffuser">Diffuser</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white capitalize">
                        {product.scentType}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Season
                    </label>
                    {isEditMode ? (
                      <select
                        name="season"
                        value={formData?.season || 'year-round'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="year-round">Year Round</option>
                        <option value="spring">Spring</option>
                        <option value="summer">Summer</option>
                        <option value="fall">Fall</option>
                        <option value="winter">Winter</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white capitalize">
                        {product.season?.replace('-', ' ') || 'Year Round'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pricing & Inventory
                </h3>
              </div>
              <div className="p-6">
                {/* 3x2 Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Row 1: Pricing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost Price ($) *
                    </label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="costPrice"
                        value={formData?.costPrice || 0}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        ${product.costPrice?.toFixed(2)}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your cost to acquire this product</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selling Price ($) *
                    </label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="price"
                        value={formData?.price || 0}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        ${product.price?.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sale Price ($)
                    </label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="salePrice"
                        value={formData?.salePrice || ''}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.salePrice ? `$${product.salePrice.toFixed(2)}` : 'No sale price'}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional discounted price</p>
                  </div>

                  {/* Row 2: Stock, Alert, Featured */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Quantity *
                    </label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="stock"
                        value={formData?.stock || 0}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.stock} units
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Stock Alert
                    </label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="minStock"
                        value={formData?.minStock || 0}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.minStock || 0} units
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Get notified when stock is low</p>
                  </div>

                  <div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer group">
                          {isEditMode ? (
                            <>
                              <input
                                type="checkbox"
                                name="isFeatured"
                                checked={formData?.isFeatured || false}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                              <div className="relative">
                                <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-200 ${formData?.isFeatured ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'}`}>
                                  {formData?.isFeatured && (
                                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="relative mr-3">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 ${product.isFeatured ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {product.isFeatured && (
                                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Featured Product</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Show this product in featured sections</p>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer group">
                          {isEditMode ? (
                            <>
                              <input
                                type="checkbox"
                                name="taxable"
                                checked={formData?.taxable || false}
                                onChange={handleInputChange}
                                className="sr-only"
                              />
                              <div className="relative">
                                <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-200 ${formData?.taxable ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-300'}`}>
                                  {formData?.taxable && (
                                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="relative mr-3">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 ${product.taxable ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {product.taxable && (
                                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Taxable Product</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Tax will be calculated at checkout</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scent Profile Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Scent Profile & Properties
                </h3>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Notes Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Top Notes
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData?.scentProfile?.topNotes?.join(', ') || ''}
                        onChange={(e) => {
                          const notes = e.target.value.split(',').map(note => note.trim()).filter(Boolean);
                          setFormData(prev => ({
                            ...prev,
                            scentProfile: {
                              ...prev?.scentProfile,
                              topNotes: notes,
                              middleNotes: prev?.scentProfile?.middleNotes || [],
                              baseNotes: prev?.scentProfile?.baseNotes || []
                            }
                          }));
                        }}
                        placeholder="e.g., Bergamot, Lemon"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.scentProfile?.topNotes?.join(', ') || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Middle Notes
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData?.scentProfile?.middleNotes?.join(', ') || ''}
                        onChange={(e) => {
                          const notes = e.target.value.split(',').map(note => note.trim()).filter(Boolean);
                          setFormData(prev => ({
                            ...prev,
                            scentProfile: {
                              ...prev?.scentProfile,
                              topNotes: prev?.scentProfile?.topNotes || [],
                              middleNotes: notes,
                              baseNotes: prev?.scentProfile?.baseNotes || []
                            }
                          }));
                        }}
                        placeholder="e.g., Lavender, Rose"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.scentProfile?.middleNotes?.join(', ') || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Notes
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData?.scentProfile?.baseNotes?.join(', ') || ''}
                        onChange={(e) => {
                          const notes = e.target.value.split(',').map(note => note.trim()).filter(Boolean);
                          setFormData(prev => ({
                            ...prev,
                            scentProfile: {
                              ...prev?.scentProfile,
                              topNotes: prev?.scentProfile?.topNotes || [],
                              middleNotes: prev?.scentProfile?.middleNotes || [],
                              baseNotes: notes
                            }
                          }));
                        }}
                        placeholder="e.g., Sandalwood, Musk"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                        {product.scentProfile?.baseNotes?.join(', ') || 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Longevity & Sillage Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longevity
                    </label>
                    {isEditMode ? (
                      <select
                        name="longevity"
                        value={formData?.longevity || 'moderate'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="light">Light (1-3 hours)</option>
                        <option value="moderate">Moderate (3-6 hours)</option>
                        <option value="long-lasting">Long-lasting (6-12 hours)</option>
                        <option value="very-long-lasting">Very Long-lasting (12+ hours)</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white capitalize">
                        {product.longevity?.replace('-', ' ') || 'Moderate'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sillage
                    </label>
                    {isEditMode ? (
                      <select
                        name="sillage"
                        value={formData?.sillage || 'moderate'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="intimate">Intimate</option>
                        <option value="moderate">Moderate</option>
                        <option value="strong">Strong</option>
                        <option value="enormous">Enormous</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white capitalize">
                        {product.sillage || 'Moderate'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </form>
        </div>
      </div>

      {/* Delete Product Modal */}
      {product && (
        <ProductDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          product={product}
          onProductUpdate={handleDeleteSuccess}
        />
      )}
    </div>
  );
}