"use client";
import React from "react";
import CategorySelector from "@/components/categories/CategorySelector";
import { ProductCreateInput } from "@/lib/services/products/types";

interface ProductDescriptionSectionProps {
  formData: Partial<ProductCreateInput>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onArrayChange: (name: string, value: string) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onSubcategoryChange: (subcategoryId: string | null) => void;
  onGenerateSKU: () => void;
  displayValues?: Record<string, string>;
  focusedFields?: Set<string>;
  onNumberFocus?: (fieldName: string) => void;
  onNumberBlur?: (fieldName: string) => void;
  getNumberDisplayValue?: (fieldName: string) => string;
  getDimensionDisplayValue?: (dimension: 'length' | 'width' | 'height') => string;
  onDimensionsChange?: (dimension: 'length' | 'width' | 'height', value: string) => void;
  onDimensionFocus?: (dimension: 'length' | 'width' | 'height') => void;
  onDimensionBlur?: (dimension: 'length' | 'width' | 'height') => void;
  isEditMode?: boolean;
}

export default function ProductDescriptionSection({
  formData,
  onInputChange,
  onArrayChange,
  onCategoryChange,
  onSubcategoryChange,
  onGenerateSKU,
  displayValues = {},
  focusedFields = new Set(),
  onNumberFocus = () => {},
  onNumberBlur = () => {},
  getNumberDisplayValue = (fieldName: string) => {
    if (focusedFields.has(fieldName) || displayValues[fieldName] !== undefined) {
      return displayValues[fieldName] || "";
    }
    const value = formData[fieldName as keyof typeof formData] as number;
    return value === 0 ? "" : String(value);
  },
  getDimensionDisplayValue = (dimension: 'length' | 'width' | 'height') => {
    const fieldName = `dimensions.${dimension}`;
    if (focusedFields.has(fieldName) || displayValues[fieldName] !== undefined) {
      return displayValues[fieldName] || "";
    }
    const value = formData.dimensions?.[dimension] || 0;
    return value === 0 ? "" : String(value);
  },
  onDimensionsChange = () => {},
  onDimensionFocus = () => {},
  onDimensionBlur = () => {},
  isEditMode = false,
}: ProductDescriptionSectionProps) {
  return (
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
                value={formData.name || ""}
                onChange={onInputChange}
                placeholder="Enter product name"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>

            {/* Category & Subcategory - Takes up 2 columns */}
            <div className="md:col-span-2">
              <CategorySelector
                selectedCategoryId={formData.categoryId || ""}
                selectedSubcategoryId={formData.subcategoryId || ""}
                onCategoryChange={onCategoryChange}
                onSubcategoryChange={onSubcategoryChange}
                required
              />
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
                value={formData.scentType || ""}
                onChange={onInputChange}
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
                value={formData.brand || ""}
                onChange={onInputChange}
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
                value={(formData.tags || []).join(', ')}
                onChange={(e) => onArrayChange('tags', e.target.value)}
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
                value={formData.gender || "unisex"}
                onChange={onInputChange}
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
                value={formData.size || ""}
                onChange={onInputChange}
                placeholder="e.g., 50ml, 100ml, 3 oz"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SKU {isEditMode && <span className="text-xs text-gray-500">(read-only)</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku || ""}
                  onChange={onInputChange}
                  placeholder={isEditMode ? "SKU" : "Auto-generated if empty"}
                  readOnly={isEditMode}
                  className={`w-full px-4 py-3 ${isEditMode ? 'pr-4' : 'pr-12'} rounded-xl border border-gray-300 dark:border-gray-600 ${isEditMode ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500`}
                />
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={onGenerateSKU}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Weight, Height, Length & Width */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weight (g)
              </label>
              <input
                type="number"
                name="weight"
                value={getNumberDisplayValue('weight')}
                onChange={onInputChange}
                onFocus={() => onNumberFocus('weight')}
                onBlur={() => onNumberBlur('weight')}
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
                value={getDimensionDisplayValue('height')}
                onChange={(e) => onDimensionsChange('height', e.target.value)}
                onFocus={() => onDimensionFocus('height')}
                onBlur={() => onDimensionBlur('height')}
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
                  value={getDimensionDisplayValue('length')}
                  onChange={(e) => onDimensionsChange('length', e.target.value)}
                  onFocus={() => onDimensionFocus('length')}
                  onBlur={() => onDimensionBlur('length')}
                  placeholder="Length"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                />
                <input
                  type="number"
                  value={getDimensionDisplayValue('width')}
                  onChange={(e) => onDimensionsChange('width', e.target.value)}
                  onFocus={() => onDimensionFocus('width')}
                  onBlur={() => onDimensionBlur('width')}
                  placeholder="Width"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Description - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={onInputChange}
              placeholder="Enter a detailed product description..."
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
