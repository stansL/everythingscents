"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductService, StorageService } from "@/lib";
import { ProductCreateInput } from "@/lib/services/products/types";
import CategorySelector from "@/components/categories/CategorySelector";
import {
  ProductDescriptionSection,
  ProductImageSection,
  ScentProfileSection,
  PricingAvailabilitySection,
  SEOCollectionsSection,
} from "@/components/products/ProductFormSections";



export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>("");
  const [formProgress, setFormProgress] = useState(0);

  // Subcategory options based on category
  const subcategoryOptions: Record<string, Array<{value: string, label: string}>> = {
    fragrances: [
      { value: 'perfumes', label: 'Perfumes' },
      { value: 'colognes', label: 'Colognes' },
      { value: 'unisex-fragrances', label: 'Unisex Fragrances' },
      { value: 'designer-fragrances', label: 'Designer Fragrances' },
      { value: 'niche-fragrances', label: 'Niche Fragrances' },
    ],
    'home-scents': [
      { value: 'candles', label: 'Candles' },
      { value: 'reed-diffusers', label: 'Reed Diffusers' },
      { value: 'room-sprays', label: 'Room Sprays' },
      { value: 'wax-melts', label: 'Wax Melts' },
      { value: 'incense', label: 'Incense' },
    ],
    'body-care': [
      { value: 'body-sprays', label: 'Body Sprays' },
      { value: 'body-oils', label: 'Body Oils' },
      { value: 'body-mists', label: 'Body Mists' },
      { value: 'lotions', label: 'Scented Lotions' },
      { value: 'soap-bars', label: 'Scented Soaps' },
    ],
    accessories: [
      { value: 'atomizers', label: 'Atomizers' },
      { value: 'diffuser-reeds', label: 'Diffuser Reeds' },
      { value: 'storage', label: 'Storage Solutions' },
      { value: 'tools', label: 'Fragrance Tools' },
    ],
    'gift-sets': [
      { value: 'fragrance-sets', label: 'Fragrance Gift Sets' },
      { value: 'discovery-sets', label: 'Discovery Sets' },
      { value: 'seasonal-sets', label: 'Seasonal Gift Sets' },
      { value: 'luxury-sets', label: 'Luxury Collections' },
    ],
    other: [
      { value: 'gift-sets', label: 'Gift Sets' },
      { value: 'samples', label: 'Samples' },
      { value: 'accessories', label: 'Accessories' },
    ]
  };

  const [formData, setFormData] = useState<ProductCreateInput>({
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
    reorderPoint: 0,
    reorderQuantity: 0,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    tags: [],
    isActive: true,
    isFeatured: false,
    status: 'draft' as const,
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

  // Display values for number inputs (to handle placeholder behavior)
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());

  // Form validation functions
  const validateFormCompleteness = React.useCallback(() => {
    const requiredFields = {
      'Basic Information': ['name', 'categoryId', 'scentType', 'brand', 'size'],
      'Pricing': ['costPrice', 'price'],
      'Inventory': ['stock'],
      'Content': ['description']
    };
    
    const incomplete = Object.entries(requiredFields).reduce((acc, [section, fields]) => {
      const missing = fields.filter(field => {
        const value = formData[field as keyof typeof formData];
        return !value || (typeof value === 'string' && value.trim() === '') || 
               (typeof value === 'number' && value <= 0);
      });
      if (missing.length > 0) {
        acc[section] = missing;
      }
      return acc;
    }, {} as Record<string, string[]>);
    
    return incomplete;
  }, [formData]);

  const validateCollections = React.useCallback(() => {
    const selectedCollections = formData.collections;
    const collectionWarnings = [];
    
    // Gender conflicts
    const genderCollections = selectedCollections.filter(c => 
      ['mens-collection', 'womens-collection', 'unisex-collection'].includes(c)
    );
    if (genderCollections.length > 1) {
      collectionWarnings.push('Multiple gender collections selected - consider using unisex only');
    }
    
    // Season conflicts  
    const seasonCollections = selectedCollections.filter(c =>
      c.startsWith('seasonal-')
    );
    if (seasonCollections.length > 2) {
      collectionWarnings.push('Too many seasonal collections selected - limit to 1-2 seasons');
    }
    
    // Price range conflicts
    const priceCollections = selectedCollections.filter(c =>
      ['luxury-collection', 'budget-friendly', 'mid-range-gems'].includes(c)
    );
    if (priceCollections.length > 1) {
      collectionWarnings.push('Multiple price range collections selected');
    }
    
    return collectionWarnings;
  }, [formData.collections]);

  const calculateFormProgress = React.useCallback(() => {
    const requiredFields = ['name', 'categoryId', 'scentType', 'brand', 'size', 'price', 'stock', 'description'];
    const optionalFields = ['subcategoryId', 'images', 'thumbnail', 'tags', 'collections'];
    
    const completedRequired = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value && (typeof value !== 'string' || value.trim() !== '') && 
             (typeof value !== 'number' || value > 0);
    }).length;
    
    const completedOptional = optionalFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value && ((Array.isArray(value) && value.length > 0) || 
             (typeof value === 'string' && value.trim() !== ''));
    }).length;
    
    const requiredProgress = (completedRequired / requiredFields.length) * 70; // 70% for required
    const optionalProgress = (completedOptional / optionalFields.length) * 30; // 30% for optional
    
    return Math.round(requiredProgress + optionalProgress);
  }, [formData]);

  // Pricing logic functions
  const calculateRecommendedPrice = React.useCallback((costPrice: number, markupPercentage: number = 40) => {
    if (!costPrice || costPrice <= 0) return 0;
    return Number((costPrice * (1 + markupPercentage / 100)).toFixed(2));
  }, []);

  const isPriceBelowRecommended = React.useCallback((price: number, costPrice: number) => {
    if (!costPrice || costPrice <= 0) return false;
    const recommendedPrice = calculateRecommendedPrice(costPrice, 40);
    return price > 0 && price < recommendedPrice;
  }, [calculateRecommendedPrice]);

  const calculateMargin = React.useCallback((price: number, costPrice: number) => {
    if (!costPrice || costPrice <= 0 || !price || price <= 0) return 0;
    return Number(((price - costPrice) / price * 100).toFixed(1));
  }, []);

  // Update progress when form data changes
  React.useEffect(() => {
    const progress = calculateFormProgress();
    setFormProgress(progress);
    
    const collectionWarnings = validateCollections();
    setWarnings(collectionWarnings);
  }, [calculateFormProgress, validateCollections]);

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
      // Store the display value as-is for better UX
      setDisplayValues(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Store the parsed number value in formData
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

  const handleNumberFocus = (fieldName: string) => {
    setFocusedFields(prev => new Set(prev).add(fieldName));
    // If the value is 0, clear the display value for better UX
    if (formData[fieldName as keyof typeof formData] === 0) {
      setDisplayValues(prev => ({
        ...prev,
        [fieldName]: ""
      }));
    }
  };

  const handleNumberBlur = (fieldName: string) => {
    setFocusedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
    
    // If empty, reset to show the actual value (including 0)
    const currentDisplayValue = displayValues[fieldName];
    if (!currentDisplayValue || currentDisplayValue.trim() === "") {
      setDisplayValues(prev => ({
        ...prev,
        [fieldName]: String(formData[fieldName as keyof typeof formData] || 0)
      }));
    }
  };

  const getNumberDisplayValue = (fieldName: string): string => {
    // If field is focused or has a display value, use that
    if (focusedFields.has(fieldName) || displayValues[fieldName] !== undefined) {
      return displayValues[fieldName] || "";
    }
    // Otherwise, show the form value (but empty string if 0)
    const value = formData[fieldName as keyof typeof formData] as number;
    return value === 0 ? "" : String(value);
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
      collections: prev.collections.includes(collectionId)
        ? prev.collections.filter(id => id !== collectionId)
        : [...prev.collections, collectionId]
    }));
  };

  const handleDimensionsChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    const fieldName = `dimensions.${dimension}`;
    
    // Store the display value
    setDisplayValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Update formData
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions!,
        [dimension]: parseFloat(value) || 0
      }
    }));
  };

  const handleDimensionFocus = (dimension: 'length' | 'width' | 'height') => {
    const fieldName = `dimensions.${dimension}`;
    setFocusedFields(prev => new Set(prev).add(fieldName));
    
    // If the value is 0, clear the display value
    const currentValue = formData.dimensions?.[dimension] || 0;
    if (currentValue === 0) {
      setDisplayValues(prev => ({
        ...prev,
        [fieldName]: ""
      }));
    }
  };

  const handleDimensionBlur = (dimension: 'length' | 'width' | 'height') => {
    const fieldName = `dimensions.${dimension}`;
    setFocusedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
    
    // Reset display value if empty
    const currentDisplayValue = displayValues[fieldName];
    if (!currentDisplayValue || currentDisplayValue.trim() === "") {
      const currentValue = formData.dimensions?.[dimension] || 0;
      setDisplayValues(prev => ({
        ...prev,
        [fieldName]: currentValue === 0 ? "" : String(currentValue)
      }));
    }
  };

  const getDimensionDisplayValue = (dimension: 'length' | 'width' | 'height'): string => {
    const fieldName = `dimensions.${dimension}`;
    
    if (focusedFields.has(fieldName) || displayValues[fieldName] !== undefined) {
      return displayValues[fieldName] || "";
    }
    
    const value = formData.dimensions?.[dimension] || 0;
    return value === 0 ? "" : String(value);
  };

  const generateSKU = () => {
    const prefix = formData.brand.substring(0, 3).toUpperCase() || "PRD";
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${prefix}-${timestamp}`;
    setFormData(prev => ({ ...prev, sku }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImageUploading(true);
    setError("");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Create stable folder structure independent of form completion
        const timestamp = Date.now();
        const tempId = `temp_${timestamp}`;
        const brandFolder = formData.brand?.replace(/[^a-zA-Z0-9]/g, '_') || 'unbranded';
        const productFolder = formData.name?.replace(/[^a-zA-Z0-9]/g, '_') || tempId;
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const folderPath = `products/${brandFolder}/${productFolder}/${fileName}`;
        
        // Store metadata for potential reorganization
        const metadata = {
          customMetadata: {
            originalBrand: formData.brand || '',
            originalProductName: formData.name || '',
            uploadedAt: new Date().toISOString(),
            tempId: tempId
          }
        };
        
        await StorageService.uploadFile(folderPath, file, metadata);
        const downloadURL = await StorageService.getDownloadURL(folderPath);
        return downloadURL;
      });

      const imageUrls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...imageUrls]);
      
      // Auto-select first image as thumbnail and update formData immediately
      if (!selectedThumbnail && imageUrls.length > 0) {
        setSelectedThumbnail(imageUrls[0]);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUrls],
          thumbnail: prev.thumbnail || imageUrls[0]
        }));
      } else {
        // Update images in formData
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUrls]
        }));
      }
    } catch (err) {
      setError(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    const newImages = uploadedImages.filter(url => url !== imageUrl);
    setUploadedImages(newImages);
    
    // Update formData images
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(url => url !== imageUrl)
    }));
    
    if (selectedThumbnail === imageUrl) {
      // Select the first remaining image as thumbnail, or clear if none
      const newThumbnail = newImages.length > 0 ? newImages[0] : "";
      setSelectedThumbnail(newThumbnail);
      setFormData(prev => ({
        ...prev,
        thumbnail: newThumbnail
      }));
    }
  };

  const handleThumbnailSelect = (imageUrl: string) => {
    setSelectedThumbnail(imageUrl);
    setFormData(prev => ({
      ...prev,
      thumbnail: imageUrl
    }));
  };

  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'publish') => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Enhanced validation for publishing
      if (saveAs === 'publish') {
        const incompleteSections = validateFormCompleteness();
        if (Object.keys(incompleteSections).length > 0) {
          const missingSections = Object.entries(incompleteSections)
            .map(([section, fields]) => `${section}: ${fields.join(', ')}`)
            .join('; ');
          setError(`Cannot publish: Missing required fields - ${missingSections}`);
          setLoading(false);
          return;
        }
      }

      // Show collection warnings but allow proceeding
      const collectionWarnings = validateCollections();
      if (collectionWarnings.length > 0) {
        console.warn('Collection validation warnings:', collectionWarnings);
        // Could show a toast notification here if desired
      }

      // Auto-generate SKU if not provided
      if (!formData.sku) {
        generateSKU();
      }

      // Set active status based on save type and include uploaded images
      const productData: ProductCreateInput = {
        ...formData,
        isActive: saveAs === 'publish',
        status: saveAs === 'publish' ? 'published' : 'draft',
        images: uploadedImages,
        thumbnail: selectedThumbnail,
        metaTitle: formData.metaTitle || formData.name,
        metaDescription: formData.metaDescription || formData.description.substring(0, 160),
      };

      const response = await ProductService.createProduct(productData);

      if (response.success) {
        router.push(`/products?message=Product ${saveAs === 'publish' ? 'published' : 'saved as draft'} successfully`);
      } else {
        setError(response.error || "Failed to create product");
      }
    } catch {
      setError("An error occurred while creating the product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Modern dropdown styling with complete borders */
          select.modern-dropdown {
            border: 2px solid #e5e7eb;
            border-radius: 0.75rem;
          }
          
          select.modern-dropdown:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          /* Style the dropdown options container */
          select.modern-dropdown option {
            background: white;
            color: #1f2937;
            padding: 12px 16px;
            border: none;
          }
          
          /* Dark mode support */
          .dark select.modern-dropdown {
            border-color: #4b5563;
            background: #1f2937;
            color: #f9fafb;
          }
          
          .dark select.modern-dropdown:focus {
            border-color: #3b82f6;
          }
          
          .dark select.modern-dropdown option {
            background: #1f2937;
            color: #f9fafb;
          }
          
          /* Enhanced dropdown appearance with bottom border */
          select.modern-dropdown {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.75rem center;
            background-repeat: no-repeat;
            background-size: 1.25em 1.25em;
            padding-right: 2.5rem;
          }
        `
      }} />
      <PageBreadcrumb pageTitle="Add Product" />
      
      {/* Form Progress Indicator */}
      <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Progress</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{formProgress}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${formProgress}%` }}
          />
        </div>
        {formProgress < 70 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Complete required fields to publish (70% minimum required)
          </p>
        )}
      </div>

      {/* Collection Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 text-amber-600 bg-amber-50 rounded-xl border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Collection Warnings:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 text-red-600 bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <form className="space-y-8">
          {/* Product Description & Basic Info */}
          <ProductDescriptionSection
            formData={formData}
            onInputChange={handleInputChange}
            onArrayChange={handleArrayChange}
            onCategoryChange={(categoryId) => 
              setFormData({ ...formData, categoryId: categoryId || "", subcategoryId: "" })
            }
            onSubcategoryChange={(subcategoryId) =>
              setFormData({ ...formData, subcategoryId: subcategoryId || "" })
            }
            onGenerateSKU={generateSKU}
            displayValues={displayValues}
            focusedFields={focusedFields}
            onNumberFocus={handleNumberFocus}
            onNumberBlur={handleNumberBlur}
            getNumberDisplayValue={getNumberDisplayValue}
            getDimensionDisplayValue={getDimensionDisplayValue}
            onDimensionsChange={handleDimensionsChange}
            onDimensionFocus={handleDimensionFocus}
            onDimensionBlur={handleDimensionBlur}
          />

          {/* Product Images */}
          <ProductImageSection
            uploadedImages={uploadedImages}
            selectedThumbnail={selectedThumbnail}
            imageUploading={imageUploading}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
            onThumbnailSelect={handleThumbnailSelect}
          />

          {/* Scent Profile */}
          <ScentProfileSection
            formData={formData}
            onInputChange={handleInputChange}
            onScentProfileChange={handleScentProfileChange}
          />

          {/* Pricing & Availability */}
          <PricingAvailabilitySection
            formData={formData}
            onInputChange={handleInputChange}
            displayValues={displayValues}
            focusedFields={focusedFields}
            onNumberFocus={handleNumberFocus}
            onNumberBlur={handleNumberBlur}
            getNumberDisplayValue={getNumberDisplayValue}
          />

          {/* SEO & Collections */}
          <SEOCollectionsSection
            formData={formData}
            onInputChange={handleInputChange}
            onArrayChange={handleArrayChange}
            onCollectionToggle={handleCollectionToggle}
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'publish')}
              disabled={loading || formProgress < 70}
              className={`px-6 py-3 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 flex items-center gap-2 ${
                formProgress >= 70 
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              title={formProgress < 70 ? `Complete form to ${Math.ceil(70 - formProgress)}% to publish` : 'Publish product'}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : formProgress >= 70 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {loading ? 'Publishing...' : formProgress >= 70 ? 'Publish Product' : `Publish (${formProgress}%)`}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
