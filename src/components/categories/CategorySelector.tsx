"use client";

import React, { useState, useEffect } from 'react';
import { Category } from '@/lib/services/categories/types';
import { CategoryService } from '@/lib/services/categories';

interface CategorySelectorProps {
  selectedCategoryId?: string | null;
  selectedSubcategoryId?: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onSubcategoryChange: (subcategoryId: string | null) => void;
  required?: boolean;
}

export default function CategorySelector({
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  required = false,
}: CategorySelectorProps) {
  const [topLevelCategories, setTopLevelCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopLevelCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const loadTopLevelCategories = async () => {
    setLoading(true);
    try {
      const response = await CategoryService.getTopLevelCategories();
      if (response.success && response.data) {
        setTopLevelCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (parentId: string) => {
    try {
      const response = await CategoryService.getSubcategories(parentId);
      if (response.success && response.data) {
        setSubcategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top-level Category */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          Category {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedCategoryId || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          required={required}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
        >
          <option value="">Select Category...</option>
          {topLevelCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon && `${category.icon} `}
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory (always shown, but disabled if no category selected) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          Subcategory
        </label>
        <select
          value={selectedSubcategoryId || ''}
          onChange={(e) => onSubcategoryChange(e.target.value || null)}
          disabled={!selectedCategoryId || subcategories.length === 0}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {!selectedCategoryId 
              ? "Select category first..." 
              : subcategories.length === 0 
              ? "No subcategories available" 
              : "All Subcategories"}
          </option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.icon && `${subcategory.icon} `}
              {subcategory.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
