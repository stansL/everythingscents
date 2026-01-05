"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CategoryTree from "@/components/categories/CategoryTree";
import CategoryForm from "@/components/categories/CategoryForm";
import { CategoryService } from "@/lib/services/categories";
import { Category, CategoryData } from "@/lib/services/categories/types";
import React, { useState, useEffect } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [refreshKey]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await CategoryService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.message || 'Failed to load categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await CategoryService.deleteCategory(categoryId);
      if (response.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(response.message || 'Failed to delete category');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleSave = async (data: CategoryData) => {
    try {
      let response;
      if (editingCategory) {
        response = await CategoryService.updateCategory(editingCategory.id, data);
      } else {
        response = await CategoryService.createCategory(data);
      }

      if (response.success) {
        setShowForm(false);
        setEditingCategory(null);
        setRefreshKey(k => k + 1);
      } else {
        throw new Error(response.message || 'Failed to save category');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleToggleActive = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await CategoryService.updateCategory(categoryId, { isActive });
      if (response.success) {
        setRefreshKey(k => k + 1);
      } else {
        alert(response.message || 'Failed to update category');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleRecalculateCounts = async () => {
    if (!confirm('Recalculate product counts for all categories? This will query all products and may take a moment.')) {
      return;
    }

    setIsRecalculating(true);
    try {
      const response = await CategoryService.recalculateProductCounts();
      if (response.success) {
        alert(`Success! ${response.data.updated} categories updated, ${response.data.failed} failed.`);
        setRefreshKey(k => k + 1);
      } else {
        alert(response.message || 'Failed to recalculate counts');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to recalculate counts');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Filter to get only top-level categories for parent selector
  const topLevelCategories = categories.filter(cat => !cat.parentId);

  return (
    <div>
      <PageBreadcrumb pageTitle="Categories" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
              Categories Management
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your product category hierarchy
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRecalculateCounts}
              disabled={isRecalculating || loading}
              className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              {isRecalculating ? '⏳ Recalculating...' : '🔄 Recalculate Counts'}
            </button>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              + Create Category
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        )}

        {/* Category Tree */}
        {!loading && !error && (
          <CategoryTree
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        )}

        {/* Empty State */}
        {!loading && !error && categories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No categories yet. Create your first category to get started.
            </p>
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showForm}
        category={editingCategory}
        parentCategories={topLevelCategories}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
      />
    </div>
  );
}