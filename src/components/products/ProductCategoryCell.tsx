"use client";

import React, { useEffect, useState } from 'react';
import { CategoryService } from '@/lib/services/categories';
import type { CategoryBreadcrumb } from '@/lib/services/categories/types';

interface ProductCategoryCellProps {
  categoryId?: string;
  subcategoryId?: string;
}

/**
 * ProductCategoryCell - Displays category breadcrumb for a product
 * Shows: Category > Subcategory (if subcategory exists)
 * Or just: Category (if no subcategory)
 */
export default function ProductCategoryCell({ categoryId, subcategoryId }: ProductCategoryCellProps) {
  const [categoryPath, setCategoryPath] = useState<CategoryBreadcrumb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryPath = async () => {
      try {
        // If we have a subcategory, use that (it will include the parent category in the breadcrumb)
        const targetId = subcategoryId || categoryId;
        
        if (!targetId) {
          setCategoryPath([]);
          setLoading(false);
          return;
        }

        const result = await CategoryService.getCategoryBreadcrumb(targetId);
        
        if (result.success && result.data) {
          setCategoryPath(result.data);
        } else {
          setCategoryPath([]);
        }
      } catch (error) {
        console.error('Error loading category path:', error);
        setCategoryPath([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryPath();
  }, [categoryId, subcategoryId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    );
  }

  if (categoryPath.length === 0) {
    return (
      <span className="text-gray-400 dark:text-gray-500 text-sm">
        No category
      </span>
    );
  }

  return (
    <div className="flex items-center text-sm">
      {categoryPath.map((category, index) => (
        <React.Fragment key={category.id}>
          {index > 0 && (
            <svg
              className="mx-1 h-4 w-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className={`${
            index === categoryPath.length - 1 
              ? 'text-black dark:text-white font-medium' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {category.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
