"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductService, StorageService, Product, ProductStatus } from "@/lib";
import { ProductDeleteModal } from "@/components/products";
import { useModal } from "@/hooks/useModal";
import {
  ProductDescriptionSection,
  ProductImageSection,
  ScentProfileSection,
  PricingAvailabilitySection,
  SEOCollectionsSection,
} from "@/components/products/ProductFormSections";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    costPrice: 0,
    price: 0,
    salePrice: 0,
    sku: "",
    categoryId: "",
    subcategoryId: "",
    brand: "",
    images: [],
    thumbnail: "",
    stock: 0,
    minStock: 0,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    tags: [],
    isActive: true,
    isFeatured: false,
    status: 'draft',
    scentProfile: {
      topNotes: [],
      middleNotes: [],
      baseNotes: [],
    },
    scentType: "perfume",
    size: "",
    gender: "unisex",
    season: "year-round",
    longevity: "moderate",
    sillage: "moderate",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    taxable: true,
    collections: [],
  });

  // Load product data
  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getProductById(productId);
      
      if (response.success && response.data) {
        setProduct(response.data);
        // Pre-fill form with product data
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
    if (isEditMode && product) {
      // Cancel - revert to original product data
      setFormData(product);
    }
    setIsEditMode(!isEditMode);
  };

  const handleDeleteProduct = () => {
    openDeleteModal();
  };

  const handleDeleteSuccess = () => {
    closeDeleteModal();
    router.push('/products?message=Product deleted successfully');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === "number") {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (name: string, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [name]: array
    }));
  };

  const handleScentProfileChange = (type: 'topNotes' | 'middleNotes' | 'baseNotes', value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      scentProfile: {
        ...prev.scentProfile!,
        [type]: array
      }
    }));
  };

  const handleCollectionToggle = (collectionId: string) => {
    setFormData(prev => ({
      ...prev,
      collections: prev.collections?.includes(collectionId)
        ? prev.collections.filter(id => id !== collectionId)
        : [...(prev.collections || []), collectionId]
    }));
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setFormData(prev => ({
      ...prev,
      categoryId: categoryId || "",
      subcategoryId: "" // Reset subcategory when category changes
    }));
  };

  const handleSubcategoryChange = (subcategoryId: string | null) => {
    setFormData(prev => ({
      ...prev,
      subcategoryId: subcategoryId || ""
    }));
  };

  const handleDimensionsChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions!,
        [dimension]: parseFloat(value) || 0
      }
    }));
  };

  const handleStatusChange = (newStatus: ProductStatus) => {
    const isActive = newStatus === 'published';
    setFormData(prev => ({ 
      ...prev, 
      status: newStatus,
      isActive 
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImageUploading(true);
    setError("");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const timestamp = Date.now();
        const brandFolder = formData.brand?.replace(/[^a-zA-Z0-9]/g, '_') || 'unbranded';
        const productFolder = formData.name?.replace(/[^a-zA-Z0-9]/g, '_') || `product_${productId}`;
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const folderPath = `products/${brandFolder}/${productFolder}/${fileName}`;
        
        const metadata = {
          customMetadata: {
            productId: productId,
            brand: formData.brand || '',
            productName: formData.name || '',
            uploadedAt: new Date().toISOString(),
          }
        };
        
        await StorageService.uploadFile(folderPath, file, metadata);
        const downloadURL = await StorageService.getDownloadURL(folderPath);
        return downloadURL;
      });

      const imageUrls = await Promise.all(uploadPromises);
      const newImages = [...(formData.images || []), ...imageUrls];
      
      // Auto-select first image as thumbnail if none selected
      const newThumbnail = formData.thumbnail || (imageUrls.length > 0 ? imageUrls[0] : "");
      
      setFormData(prev => ({
        ...prev,
        images: newImages,
        thumbnail: newThumbnail
      }));
    } catch (err) {
      setError(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    const newImages = (formData.images || []).filter(url => url !== imageUrl);
    
    setFormData(prev => {
      const updates: Partial<Product> = {
        ...prev,
        images: newImages
      };
      
      // If removed image was the thumbnail, select first remaining or clear
      if (prev.thumbnail === imageUrl) {
        updates.thumbnail = newImages.length > 0 ? newImages[0] : "";
      }
      
      return updates;
    });
  };

  const handleThumbnailSelect = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      thumbnail: imageUrl
    }));
  };

  const handleUpdate = async () => {
    if (!product || !product.id) return;
    
    try {
      setSaving(true);
      setError("");
      
      const response = await ProductService.updateProduct(product.id, formData);
      
      if (response.success) {
        setProduct({ ...product, ...formData });
        setIsEditMode(false);
        // Could show success message
      } else {
        setError(response.error || "Failed to update product");
      }
    } catch (err) {
      setError("An error occurred while updating the product");
      console.error("Error updating product:", err);
    } finally {
      setSaving(false);
    }
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

  if (error && !product) {
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
        pageTitle={isEditMode ? `Edit: ${product?.name}` : product?.name || "Product Details"} 
      />
      
      {error && (
        <div className="mb-6 p-4 text-red-600 bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
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
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          {product && (
          <form className="space-y-8">
            
            {/* Status Management Section - Show only in edit mode */}
            {isEditMode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Product Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Status
                    </label>
                    <select
                      value={formData?.status ?? 'draft'}
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

            {/* Product Description Section - Using Reusable Component */}
            <ProductDescriptionSection
              formData={formData}
              isEditMode={isEditMode}
              onInputChange={handleInputChange}
              onArrayChange={handleArrayChange}
              onCategoryChange={handleCategoryChange}
              onSubcategoryChange={handleSubcategoryChange}
              onDimensionsChange={handleDimensionsChange}
              onGenerateSKU={() => {}} // SKU is read-only in edit mode
            />

            {/* Product Images Section - Using Reusable Component */}
            <ProductImageSection
              uploadedImages={formData.images || []}
              selectedThumbnail={formData.thumbnail || ""}
              imageUploading={imageUploading}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              onThumbnailSelect={handleThumbnailSelect}
              isEditMode={isEditMode}
            />

            {/* Scent Profile Section - Using Reusable Component */}
            <ScentProfileSection
              formData={formData}
              isEditMode={isEditMode}
              onInputChange={handleInputChange}
              onScentProfileChange={handleScentProfileChange}
            />

            {/* Pricing & Availability Section - Using Reusable Component */}
            <PricingAvailabilitySection
              formData={formData}
              isEditMode={isEditMode}
              onInputChange={handleInputChange}
            />

            {/* SEO & Collections Section - Using Reusable Component */}
            <SEOCollectionsSection
              formData={formData}
              isEditMode={isEditMode}
              onInputChange={handleInputChange}
              onArrayChange={handleArrayChange}
              onCollectionToggle={handleCollectionToggle}
            />
            
          </form>
        )}
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
