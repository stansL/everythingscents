"use client";

import React, { useState } from "react";
import { Category } from "@/lib/services/categories/types";

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onToggleActive: (categoryId: string, isActive: boolean) => void;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  childCategories: Category[];
  allCategories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onToggleActive: (categoryId: string, isActive: boolean) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  childCategories,
  allCategories,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = childCategories.length > 0;

  return (
    <div className="border-l-2 border-gray-200 dark:border-gray-700">
      <div
        className="group flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5"
        style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <span className="text-lg">▼</span>
            ) : (
              <span className="text-lg">▶</span>
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        {/* Category Icon */}
        {category.icon && (
          <span className="text-2xl" role="img" aria-label={category.name}>
            {category.icon}
          </span>
        )}

        {/* Category Name */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {category.name}
            </span>
            {!category.isActive && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Inactive
              </span>
            )}
          </div>
          {category.description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {category.description}
            </p>
          )}
        </div>

        {/* Product Count Badge */}
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {category.productCount || 0} {category.productCount === 1 ? 'product' : 'products'}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onToggleActive(category.id, !category.isActive)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            title={category.isActive ? "Deactivate" : "Activate"}
          >
            {category.isActive ? "⏸️" : "▶️"}
          </button>
          <button
            onClick={() => onEdit(category)}
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {childCategories.map((child) => {
            const grandChildren = allCategories.filter((c) => c.parentId === child.id);
            return (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
                childCategories={grandChildren}
                allCategories={allCategories}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  // Get root categories (no parent)
  const rootCategories = categories.filter((cat) => !cat.parentId);

  if (rootCategories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {rootCategories.map((category) => {
        const childCategories = categories.filter((c) => c.parentId === category.id);
        return (
          <CategoryNode
            key={category.id}
            category={category}
            level={0}
            childCategories={childCategories}
            allCategories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        );
      })}
    </div>
  );
};

export default CategoryTree;
