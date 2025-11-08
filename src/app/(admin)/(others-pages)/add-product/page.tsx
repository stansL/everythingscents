"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductService, StorageService } from "@/lib";
import { ProductCreateInput } from "@/lib/services/products/types";



export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>("");
  const [formProgress, setFormProgress] = useState(0);

  // Available collections for products - Comprehensive fragrance industry collections
  const availableCollections = [
    // 🎯 Popular & Trending Collections
    { id: 'new-arrivals', name: 'New Arrivals', description: 'Latest products added to our store' },
    { id: 'best-sellers', name: 'Best Sellers', description: 'Our most popular products' },
    { id: 'staff-picks', name: 'Staff Picks', description: 'Curated by our scent experts' },
    { id: 'trending-now', name: 'Trending Now', description: 'Current viral and popular fragrances' },
    { id: 'customer-favorites', name: 'Customer Favorites', description: 'Top-rated by our customers' },
    
    // 💰 Price Range Collections
    { id: 'luxury-collection', name: 'Luxury Collection', description: 'Premium high-end designer fragrances' },
    { id: 'budget-friendly', name: 'Budget Friendly', description: 'Great scents at affordable prices' },
    { id: 'mid-range-gems', name: 'Mid-Range Gems', description: 'Quality fragrances at moderate prices' },
    { id: 'designer-dupes', name: 'Designer Dupes', description: 'Affordable alternatives to designer fragrances' },
    
    // 👥 Gender Collections
    { id: 'mens-collection', name: "Men's Collection", description: 'Masculine fragrances and colognes' },
    { id: 'womens-collection', name: "Women's Collection", description: 'Feminine perfumes and scents' },
    { id: 'unisex-collection', name: 'Unisex Collection', description: 'Gender-neutral fragrances for everyone' },
    
    // 🌟 Seasonal Collections
    { id: 'seasonal-spring', name: 'Spring Awakening', description: 'Fresh, floral scents for spring' },
    { id: 'seasonal-summer', name: 'Summer Breeze', description: 'Light, aquatic, and citrus summer scents' },
    { id: 'seasonal-fall', name: 'Autumn Spice', description: 'Warm, spicy, and woody autumn fragrances' },
    { id: 'seasonal-winter', name: 'Winter Warmth', description: 'Rich, cozy, and warming winter scents' },
    
    // 🎉 Holiday & Special Occasion Collections
    { id: 'holiday-2025', name: 'Holiday 2025', description: 'Festive scents for the holiday season' },
    { id: 'valentine-romance', name: 'Valentine Romance', description: 'Romantic and sensual scents for love' },
    { id: 'mothers-day', name: "Mother's Day", description: 'Perfect gifts for mothers' },
    { id: 'graduation-gifts', name: 'Graduation Gifts', description: 'Milestone celebration scents' },
    { id: 'wedding-collection', name: 'Wedding Collection', description: 'Bridal and wedding party fragrances' },
    
    // 🎭 Occasion-Based Collections
    { id: 'office-appropriate', name: 'Office Appropriate', description: 'Professional, subtle scents for work' },
    { id: 'date-night', name: 'Date Night', description: 'Seductive and alluring evening fragrances' },
    { id: 'everyday-wear', name: 'Everyday Wear', description: 'Versatile scents for daily use' },
    { id: 'special-occasions', name: 'Special Occasions', description: 'Statement fragrances for events' },
    { id: 'gym-fresh', name: 'Gym & Active', description: 'Fresh, energizing scents for active lifestyle' },
    
    // 🌺 Fragrance Family Collections
    { id: 'floral-bouquet', name: 'Floral Bouquet', description: 'Rose, jasmine, and floral compositions' },
    { id: 'citrus-fresh', name: 'Citrus Fresh', description: 'Lemon, orange, and zesty fragrances' },
    { id: 'woody-warm', name: 'Woody & Warm', description: 'Sandalwood, cedar, and woody notes' },
    { id: 'oriental-spicy', name: 'Oriental & Spicy', description: 'Exotic spices and oriental blends' },
    { id: 'gourmand-sweet', name: 'Gourmand & Sweet', description: 'Vanilla, chocolate, and edible scents' },
    { id: 'aquatic-marine', name: 'Aquatic & Marine', description: 'Ocean-inspired and fresh water scents' },
    { id: 'green-herbal', name: 'Green & Herbal', description: 'Grass, herbs, and nature-inspired scents' },
    
    // ⏰ Longevity & Performance Collections
    { id: 'long-lasting', name: 'Long Lasting', description: 'Fragrances with exceptional longevity (8+ hours)' },
    { id: 'beast-mode', name: 'Beast Mode', description: 'Maximum projection and performance' },
    { id: 'skin-scents', name: 'Skin Scents', description: 'Intimate, close-to-skin fragrances' },
    { id: 'office-safe', name: 'Office Safe', description: 'Subtle projection for professional settings' },
    
    // 🌿 Ingredient & Style Collections
    { id: 'natural-organic', name: 'Natural & Organic', description: 'Made with natural and organic ingredients' },
    { id: 'vegan-friendly', name: 'Vegan Friendly', description: 'Cruelty-free and vegan formulations' },
    { id: 'oil-based', name: 'Oil Based', description: 'Pure fragrance oils and attar' },
    { id: 'alcohol-free', name: 'Alcohol Free', description: 'Gentle formulations without alcohol' },
    { id: 'niche-artisan', name: 'Niche & Artisan', description: 'Independent and artisanal perfume houses' },
    
    // 🎯 Age & Demographic Collections
    { id: 'teen-young', name: 'Teen & Young', description: 'Fresh, playful scents for younger users' },
    { id: 'mature-sophisticated', name: 'Mature & Sophisticated', description: 'Refined scents for experienced users' },
    { id: 'celebrity-inspired', name: 'Celebrity Inspired', description: 'Fragrances from celebrity lines' },
    
    // 🏠 Home & Lifestyle Collections
    { id: 'home-scents', name: 'Home Scents', description: 'Candles, diffusers, and home fragrances' },
    { id: 'car-fresheners', name: 'Car Fresheners', description: 'Automotive and travel scents' },
    { id: 'body-care', name: 'Body Care', description: 'Lotions, mists, and body products' },
    
    // 🎁 Gift Collections
    { id: 'gift-sets', name: 'Gift Sets', description: 'Curated gift packages and bundles' },
    { id: 'travel-size', name: 'Travel Size', description: 'Portable and travel-friendly sizes' },
    { id: 'discovery-sets', name: 'Discovery Sets', description: 'Sample sets to explore new scents' },
    
    // 🌍 Regional & Cultural Collections
    { id: 'middle-eastern', name: 'Middle Eastern', description: 'Oud, amber, and Middle Eastern influences' },
    { id: 'french-elegance', name: 'French Elegance', description: 'Classic French perfumery tradition' },
    { id: 'american-fresh', name: 'American Fresh', description: 'Modern American fragrance style' },
    { id: 'asian-inspired', name: 'Asian Inspired', description: 'Tea, incense, and Asian fragrance notes' },
  ];

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
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    tags: [],
    isActive: true,
    isFeatured: false,
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
      collections: prev.collections.includes(collectionId)
        ? prev.collections.filter(id => id !== collectionId)
        : [...prev.collections, collectionId]
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
          {/* Product Description Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Product Description
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Row 1: Product Name, Category, Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      required
                      className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md"
                    >
                      <option value="">Select Category</option>
                      <option value="fragrances">Fragrances</option>
                      <option value="home-scents">Home Scents</option>
                      <option value="body-care">Body Care</option>
                      <option value="accessories">Accessories</option>
                      <option value="gift-sets">Gift Sets</option>
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subcategory
                    </label>
                    <select
                      name="subcategoryId"
                      value={formData.subcategoryId}
                      onChange={handleInputChange}
                      disabled={!formData.categoryId}
                      className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Subcategory</option>
                      {subcategoryOptions[formData.categoryId as keyof typeof subcategoryOptions]?.map((sub) => (
                        <option key={sub.value} value={sub.value}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Scent Type, Brand, Tags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Scent Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scent Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="scentType"
                      value={formData.scentType}
                      onChange={handleInputChange}
                      required
                      className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md"
                    >
                      <option value="">Select Scent Type</option>
                      <option value="perfume">Perfume (EDP/EDT)</option>
                      <option value="cologne">Cologne</option>
                      <option value="body-spray">Body Spray</option>
                      <option value="candle">Candle</option>
                      <option value="diffuser">Diffuser/Reed</option>
                      <option value="oil">Body Oil</option>
                      <option value="mist">Body Mist</option>
                      <option value="solid">Solid Fragrance</option>
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder="Enter brand name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => handleArrayChange('tags', e.target.value)}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                  </div>
                </div>

                {/* Row 3: Gender, Size, SKU */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md"
                    >
                      <option value="unisex">Unisex</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Size <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      placeholder="e.g., 50ml, 100ml, 3 oz"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SKU
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="Auto-generated if empty"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      />
                      <button
                        type="button"
                        onClick={generateSKU}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 4: Weight, Height, Length & Width (combined) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Weight (g)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="Weight in grams"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.dimensions?.height || 0}
                      onChange={(e) => handleDimensionsChange('height', e.target.value)}
                      placeholder="Height"
                      step="0.1"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                  </div>

                  {/* Length & Width Combined */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Length & Width (cm)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={formData.dimensions?.length || 0}
                        onChange={(e) => handleDimensionsChange('length', e.target.value)}
                        placeholder="Length"
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      />
                      <input
                        type="number"
                        value={formData.dimensions?.width || 0}
                        onChange={(e) => handleDimensionsChange('width', e.target.value)}
                        placeholder="Width"
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Description & Product Images - Side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter a detailed product description..."
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-y"
                    />
                  </div>

                  {/* Product Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Images
                    </label>
                    <div className="space-y-4">
                      {/* Upload Button */}
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-31 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                          <div className="flex flex-col items-center justify-center pt-4 pb-5">
                            <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">Click to upload</span> images
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            multiple 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={imageUploading}
                          />
                        </label>
                      </div>

                      {/* Loading State */}
                      {imageUploading && (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                        </div>
                      )}

                      {/* Uploaded Images Grid */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {uploadedImages.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                                <Image
                                  src={imageUrl}
                                  alt={`Product image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 50vw, 25vw"
                                />
                                
                                {/* Thumbnail Badge */}
                                {selectedThumbnail === imageUrl && (
                                  <div className="absolute top-1 left-1">
                                    <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                      Thumb
                                    </span>
                                  </div>
                                )}
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleThumbnailSelect(imageUrl)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full transition-colors"
                                    title="Set as thumbnail"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(imageUrl)}
                                    className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"
                                    title="Remove image"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadedImages.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Click ✓ to set thumbnail. First image auto-selected.
                        </p>
                      )}
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
                Scent Profile
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Top Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Top Notes
                  </label>
                  <input
                    type="text"
                    value={formData.scentProfile?.topNotes.join(', ') || ''}
                    onChange={(e) => handleScentProfileChange('topNotes', e.target.value)}
                    placeholder="e.g., Bergamot, Lemon"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">First impression notes</p>
                </div>

                {/* Middle Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Middle Notes
                  </label>
                  <input
                    type="text"
                    value={formData.scentProfile?.middleNotes.join(', ') || ''}
                    onChange={(e) => handleScentProfileChange('middleNotes', e.target.value)}
                    placeholder="e.g., Lavender, Rose"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Heart of the fragrance</p>
                </div>

                {/* Base Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Base Notes
                  </label>
                  <input
                    type="text"
                    value={formData.scentProfile?.baseNotes.join(', ') || ''}
                    onChange={(e) => handleScentProfileChange('baseNotes', e.target.value)}
                    placeholder="e.g., Sandalwood, Musk"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lasting foundation notes</p>
                </div>

                {/* Season */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Season
                  </label>
                  <select
                    name="season"
                    value={formData.season}
                    onChange={handleInputChange}
                    className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="year-round">Year Round</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>

                {/* Longevity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longevity
                  </label>
                  <select
                    name="longevity"
                    value={formData.longevity}
                    onChange={handleInputChange}
                    className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="light">Light (1-3 hours)</option>
                    <option value="moderate">Moderate (3-6 hours)</option>
                    <option value="long-lasting">Long-lasting (6-12 hours)</option>
                    <option value="very-long-lasting">Very Long-lasting (12+ hours)</option>
                  </select>
                </div>

                {/* Sillage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sillage
                  </label>
                  <select
                    name="sillage"
                    value={formData.sillage}
                    onChange={handleInputChange}
                    className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="intimate">Intimate</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                    <option value="enormous">Enormous</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Availability Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pricing & Availability
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Cost Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cost Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your cost to acquire this product</p>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selling Price ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isPriceBelowRecommended(formData.price, formData.costPrice)
                          ? 'border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                      } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500`}
                    />
                    {formData.costPrice > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          price: calculateRecommendedPrice(formData.costPrice)
                        }))}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        Use ${calculateRecommendedPrice(formData.costPrice)}
                      </button>
                    )}
                  </div>
                  
                  {/* Price recommendations and warnings */}
                  {formData.costPrice > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-green-600 dark:text-green-400">
                        💡 Recommended (40% markup): ${calculateRecommendedPrice(formData.costPrice)}
                      </p>
                      {formData.price > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Profit Margin: {calculateMargin(formData.price, formData.costPrice)}%
                        </p>
                      )}
                      {isPriceBelowRecommended(formData.price, formData.costPrice) && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          ⚠️ Price is below recommended 40% markup
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Sale Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sale Price ($)
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional discounted price</p>
                </div>
              </div>

              {/* Stock and Alert Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                </div>

                {/* Minimum Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Stock Alert
                  </label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Get notified when stock is low</p>
                </div>

                {/* Featured Product */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="relative">
                      <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-200 ${formData.isFeatured ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'}`}>
                        {formData.isFeatured && (
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Featured Product</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show this product in featured sections</p>
                    </div>
                  </label>
                </div>

                {/* Tax Settings */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      name="taxable"
                      checked={formData.taxable}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxable: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className="relative">
                      <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-200 ${formData.taxable ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-300'}`}>
                        {formData.taxable && (
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Taxable Product</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tax will be calculated at checkout</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                </svg>
                SEO Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Meta Title and Meta Keywords - Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      placeholder="SEO title (leave empty to use product name)"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optimal length: 50-60 characters</p>
                  </div>

                  {/* Meta Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.metaKeywords?.join(', ') || ''}
                      onChange={(e) => handleArrayChange('metaKeywords', e.target.value)}
                      placeholder="SEO keywords separated by commas"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Relevant keywords for search engines</p>
                  </div>
                </div>

                {/* Meta Description - Full width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    placeholder="SEO description (leave empty to use product description)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-y"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optimal length: 150-160 characters</p>
                </div>

                {/* Collections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Collections ({availableCollections.length} available)
                  </label>
                  
                  {/* Quick Selection Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        collections: availableCollections
                          .filter(c => ['new-arrivals', 'best-sellers', 'trending-now'].includes(c.id))
                          .map(c => c.id)
                      }))}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-300"
                    >
                      Popular
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        collections: availableCollections
                          .filter(c => c.id.includes('seasonal'))
                          .map(c => c.id)
                      }))}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors dark:bg-green-900 dark:text-green-300"
                    >
                      Seasonal
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, collections: [] }))}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-4 max-h-72 overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800">
                    {/* Popular & Trending */}
                    <div>
                      <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide">
                        🎯 Popular & Trending
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableCollections
                          .filter(c => ['new-arrivals', 'best-sellers', 'staff-picks', 'trending-now', 'customer-favorites'].includes(c.id))
                          .map((collection) => (
                            <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.collections.includes(collection.id)}
                                onChange={() => handleCollectionToggle(collection.id)}
                                className="mt-0.5 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{collection.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{collection.description}</div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">
                        💰 Price Range
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableCollections
                          .filter(c => ['luxury-collection', 'budget-friendly', 'mid-range-gems', 'designer-dupes'].includes(c.id))
                          .map((collection) => (
                            <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.collections.includes(collection.id)}
                                onChange={() => handleCollectionToggle(collection.id)}
                                className="mt-0.5 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{collection.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{collection.description}</div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Seasonal */}
                    <div>
                      <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                        🌟 Seasonal & Occasions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableCollections
                          .filter(c => c.id.includes('seasonal') || ['holiday-2025', 'valentine-romance', 'mothers-day', 'graduation-gifts', 'wedding-collection'].includes(c.id))
                          .map((collection) => (
                            <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.collections.includes(collection.id)}
                                onChange={() => handleCollectionToggle(collection.id)}
                                className="mt-0.5 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{collection.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{collection.description}</div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Show remaining collections in a collapsible section */}
                    <details className="group">
                      <summary className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                        <span>View All Collections ({availableCollections.length - 13} more)</span>
                        <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableCollections
                          .filter(c => !['new-arrivals', 'best-sellers', 'staff-picks', 'trending-now', 'customer-favorites', 'luxury-collection', 'budget-friendly', 'mid-range-gems', 'designer-dupes', 'seasonal-spring', 'seasonal-summer', 'seasonal-fall', 'seasonal-winter', 'holiday-2025', 'valentine-romance', 'mothers-day', 'graduation-gifts', 'wedding-collection'].includes(c.id))
                          .map((collection) => (
                            <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.collections.includes(collection.id)}
                                onChange={() => handleCollectionToggle(collection.id)}
                                className="mt-0.5 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{collection.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{collection.description}</div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </details>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Selected: {formData.collections.length} collections
                    </p>
                    {formData.collections.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {formData.collections.slice(0, 3).map(collectionId => {
                          const collection = availableCollections.find(c => c.id === collectionId);
                          return collection ? (
                            <span key={collectionId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              {collection.name}
                              <button
                                type="button"
                                onClick={() => handleCollectionToggle(collectionId)}
                                className="ml-1 text-orange-600 hover:text-orange-800"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                        {formData.collections.length > 3 && (
                          <span className="text-xs text-gray-500">+{formData.collections.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

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