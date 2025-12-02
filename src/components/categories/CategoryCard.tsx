"use client";

import React from "react";
import { Category } from "@/lib/services/categories/types";
import CategoryBreadcrumb from "./CategoryBreadcrumb";

interface CategoryCardProps {
  category: Category;
  breadcrumb?: Category[];
  productCount?: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onClick?: (category: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  breadcrumb = [],
  productCount = 0,
  onEdit,
  onDelete,
  onClick,
}) => {
  return (
    <div
      className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      onClick={() => onClick?.(category)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header with Icon and Actions */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {category.icon && (
            <span className="text-4xl" role="img" aria-label={category.name}>
              {category.icon}
            </span>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {category.name}
            </h3>
            {breadcrumb.length > 0 && (
              <div className="mt-1">
                <CategoryBreadcrumb categories={breadcrumb} showHome={false} />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category.id);
            }}
            className="rounded-lg p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      {category.description && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {category.description}
        </p>
      )}

      {/* Footer with Product Count and Status */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {productCount} {productCount === 1 ? "product" : "products"}
        </span>
        {!category.isActive && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Inactive
          </span>
        )}
      </div>
    </div>
  );
};

export default CategoryCard;
