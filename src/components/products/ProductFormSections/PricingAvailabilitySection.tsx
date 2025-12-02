"use client";
import React from "react";
import { ProductCreateInput } from "@/lib/services/products/types";

interface PricingAvailabilitySectionProps {
  formData: Partial<ProductCreateInput>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  displayValues?: Record<string, string>;
  focusedFields?: Set<string>;
  onNumberFocus?: (fieldName: string) => void;
  onNumberBlur?: (fieldName: string) => void;
  getNumberDisplayValue?: (fieldName: string) => string;
  calculateRecommendedPrice?: (costPrice: number, markupPercentage?: number) => number;
  isPriceBelowRecommended?: (price: number, costPrice: number) => boolean;
  calculateMargin?: (price: number, costPrice: number) => number;
  onUseRecommendedPrice?: () => void;
}

export default function PricingAvailabilitySection({
  formData,
  onInputChange,
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
  calculateRecommendedPrice = (costPrice: number, markupPercentage: number = 40) => {
    if (!costPrice || costPrice <= 0) return 0;
    return Number((costPrice * (1 + markupPercentage / 100)).toFixed(2));
  },
  isPriceBelowRecommended = (price: number, costPrice: number) => {
    if (!costPrice || costPrice <= 0) return false;
    const recommendedPrice = calculateRecommendedPrice(costPrice, 40);
    return price > 0 && price < recommendedPrice;
  },
  calculateMargin = (price: number, costPrice: number) => {
    if (!costPrice || costPrice <= 0 || !price || price <= 0) return 0;
    return Number(((price - costPrice) / price * 100).toFixed(1));
  },
  onUseRecommendedPrice,
}: PricingAvailabilitySectionProps) {
  return (
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
              value={getNumberDisplayValue('costPrice')}
              onChange={onInputChange}
              onFocus={() => onNumberFocus('costPrice')}
              onBlur={() => onNumberBlur('costPrice')}
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
                value={getNumberDisplayValue('price')}
                onChange={onInputChange}
                onFocus={() => onNumberFocus('price')}
                onBlur={() => onNumberBlur('price')}
                placeholder="0.00"
                required
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 rounded-xl border ${
                  isPriceBelowRecommended(formData.price || 0, formData.costPrice || 0)
                    ? 'border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500`}
              />
              {(formData.costPrice || 0) > 0 && onUseRecommendedPrice && (
                <button
                  type="button"
                  onClick={onUseRecommendedPrice}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  Use ${calculateRecommendedPrice(formData.costPrice || 0)}
                </button>
              )}
            </div>
            
            {/* Price recommendations and warnings */}
            {(formData.costPrice || 0) > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-600 dark:text-green-400">
                  💡 Recommended (40% markup): ${calculateRecommendedPrice(formData.costPrice || 0)}
                </p>
                {(formData.price || 0) > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Profit Margin: {calculateMargin(formData.price || 0, formData.costPrice || 0)}%
                  </p>
                )}
                {isPriceBelowRecommended(formData.price || 0, formData.costPrice || 0) && (
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
              value={getNumberDisplayValue('salePrice')}
              onChange={onInputChange}
              onFocus={() => onNumberFocus('salePrice')}
              onBlur={() => onNumberBlur('salePrice')}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Optional discounted price</p>
          </div>
        </div>

        {/* Stock, Alert, and Featured Product Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6">
          {/* Stock Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              value={getNumberDisplayValue('stock')}
              onChange={onInputChange}
              onFocus={() => onNumberFocus('stock')}
              onBlur={() => onNumberBlur('stock')}
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
              value={getNumberDisplayValue('minStock')}
              onChange={onInputChange}
              onFocus={() => onNumberFocus('minStock')}
              onBlur={() => onNumberBlur('minStock')}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Get notified when stock is low</p>
          </div>

          {/* Featured Product and Taxable Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Features
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured || false}
                    onChange={onInputChange}
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

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="taxable"
                    checked={formData.taxable !== undefined ? formData.taxable : true}
                    onChange={onInputChange}
                    className="sr-only"
                  />
                  <div className="relative">
                    <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-200 ${formData.taxable !== false ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-300'}`}>
                      {formData.taxable !== false && (
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
      </div>
    </div>
  );
}
