"use client";
import React from "react";
import { AVAILABLE_COLLECTIONS as availableCollections } from "@/constants/collections";

interface SEOCollectionsSectionProps {
  formData: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    collections: string[];
  };
  isEditMode?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onArrayChange: (name: string, value: string) => void;
  onCollectionToggle: (collectionId: string) => void;
  onBulkCollectionSelect?: (collectionIds: string[]) => void;
}

export default function SEOCollectionsSection({
  formData,
  isEditMode = true,
  onInputChange,
  onArrayChange,
  onCollectionToggle,
  onBulkCollectionSelect,
}: SEOCollectionsSectionProps) {
  const handlePopularSelect = () => {
    if (onBulkCollectionSelect) {
      const popularIds = availableCollections
        .filter(c => c.category === 'popular')
        .map(c => c.id);
      onBulkCollectionSelect(popularIds);
    }
  };

  const handleSeasonalSelect = () => {
    if (onBulkCollectionSelect) {
      const seasonalIds = availableCollections
        .filter(c => c.id.includes('seasonal'))
        .map(c => c.id);
      onBulkCollectionSelect(seasonalIds);
    }
  };

  const handleClearAll = () => {
    if (onBulkCollectionSelect) {
      onBulkCollectionSelect([]);
    }
  };

  return (
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
              {isEditMode ? (
                <>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={onInputChange}
                    placeholder="SEO title (leave empty to use product name)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optimal length: 50-60 characters</p>
                </>
              ) : (
                <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
                  {formData.metaTitle || 'Not set'}
                </div>
              )}
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Keywords
              </label>
              {isEditMode ? (
                <>
                  <input
                    type="text"
                    value={formData.metaKeywords?.join(', ') || ''}
                    onChange={(e) => onArrayChange('metaKeywords', e.target.value)}
                    placeholder="SEO keywords separated by commas"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Relevant keywords for search engines</p>
                </>
              ) : (
                <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
                  {formData.metaKeywords?.join(', ') || 'No keywords'}
                </div>
              )}
            </div>
          </div>

          {/* Meta Description - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meta Description
            </label>
            {isEditMode ? (
              <>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={onInputChange}
                  placeholder="SEO description (leave empty to use product description)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">Optimal length: 150-160 characters</p>
              </>
            ) : (
              <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white whitespace-pre-wrap">
                {formData.metaDescription || 'Not set'}
              </div>
            )}
          </div>

          {/* Collections */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Collections ({availableCollections.length} available)
            </label>
            
            {isEditMode && (
              <>
                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handlePopularSelect}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-300"
                  >
                    Popular
                  </button>
                  <button
                    type="button"
                    onClick={handleSeasonalSelect}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors dark:bg-green-900 dark:text-green-300"
                  >
                    Seasonal
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
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
                        .filter(c => c.category === 'popular')
                        .map((collection) => (
                          <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={(formData.collections || []).includes(collection.id)}
                              onChange={() => onCollectionToggle(collection.id)}
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
                        .filter(c => c.category === 'price')
                        .map((collection) => (
                          <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={(formData.collections || []).includes(collection.id)}
                              onChange={() => onCollectionToggle(collection.id)}
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
                        .filter(c => c.category === 'seasonal')
                        .map((collection) => (
                          <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={(formData.collections || []).includes(collection.id)}
                              onChange={() => onCollectionToggle(collection.id)}
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
                      <span>View All Collections ({availableCollections.filter(c => !['popular', 'price', 'seasonal'].includes(c.category)).length} more)</span>
                      <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {availableCollections
                        .filter(c => !['popular', 'price', 'seasonal'].includes(c.category))
                        .map((collection) => (
                          <label key={collection.id} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={(formData.collections || []).includes(collection.id)}
                              onChange={() => onCollectionToggle(collection.id)}
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
              </>
            )}

            {/* View Mode Collections Display */}
            {!isEditMode && (
              <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {formData.collections && formData.collections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.collections?.map(collectionId => {
                      const collection = availableCollections.find(c => c.id === collectionId);
                      return collection ? (
                        <span key={collectionId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          {collection.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No collections selected</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Selected: {formData.collections?.length || 0} collections
              </p>
              {formData.collections && formData.collections.length > 0 && isEditMode && (
                <div className="flex flex-wrap gap-1 max-w-md">
                  {formData.collections.slice(0, 3).map(collectionId => {
                    const collection = availableCollections.find(c => c.id === collectionId);
                    return collection ? (
                      <span key={collectionId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        {collection.name}
                        <button
                          type="button"
                          onClick={() => onCollectionToggle(collectionId)}
                          className="ml-1 text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                  {formData.collections && formData.collections.length > 3 && (
                    <span className="text-xs text-gray-500">+{formData.collections.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
