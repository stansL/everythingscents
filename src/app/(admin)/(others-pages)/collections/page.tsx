"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useState, useEffect } from "react";
import { 
  getAllCollections, 
  updateCollectionProductCount,
  createCollection,
  updateCollection,
  deleteCollection,
  type Collection 
} from "@/lib/services/collectionService";
import CollectionForm from "@/components/collections/CollectionForm";
import DeleteCollectionModal from "@/components/collections/DeleteCollectionModal";

const CATEGORY_LABELS: { [key: string]: { label: string; color: string } } = {
  popular: { label: '🎯 Popular & Trending', color: 'orange' },
  price: { label: '💰 Price Range', color: 'green' },
  gender: { label: '👥 Gender', color: 'purple' },
  seasonal: { label: '🌟 Seasonal & Occasions', color: 'blue' },
  occasion: { label: '🎭 Occasion-Based', color: 'pink' },
  'fragrance-family': { label: '🌺 Fragrance Family', color: 'rose' },
  performance: { label: '⏰ Longevity & Performance', color: 'indigo' },
  ingredient: { label: '🌿 Ingredient & Style', color: 'emerald' },
  demographic: { label: '🎯 Age & Demographic', color: 'amber' },
  lifestyle: { label: '🏠 Home & Lifestyle', color: 'cyan' },
  gift: { label: '🎁 Gift Collections', color: 'red' },
  regional: { label: '🌍 Regional & Cultural', color: 'violet' },
};

type FormData = Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>;

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recalculating, setRecalculating] = useState<string | null>(null);
  
  // Expanded category state - only one can be expanded at a time, null means all collapsed
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCollections();
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateCount = async (collectionId: string) => {
    setRecalculating(collectionId);
    try {
      const count = await updateCollectionProductCount(collectionId);
      setCollections(prev => 
        prev.map(col => 
          col.id === collectionId 
            ? { ...col, productCount: count }
            : col
        )
      );
    } catch (err) {
      console.error('Failed to recalculate count:', err);
    } finally {
      setRecalculating(null);
    }
  };

  const openCreateModal = () => {
    setEditingCollection(null);
    setShowModal(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setShowModal(true);
  };

  const handleSave = async (data: FormData) => {
    try {
      if (editingCollection) {
        await updateCollection(editingCollection.id, data);
      } else {
        await createCollection(data);
      }
      setShowModal(false);
      await loadCollections();
    } catch (err) {
      console.error('Error saving collection:', err);
      throw err; // Let the form component handle the error display
    }
  };

  const openDeleteModal = (collection: Collection) => {
    setDeletingCollection(collection);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingCollection) return;
    
    try {
      await deleteCollection(deletingCollection.id);
      setShowDeleteModal(false);
      setDeletingCollection(null);
      await loadCollections();
    } catch (err) {
      console.error('Error deleting collection:', err);
      throw err; // Let the modal component handle the error display
    }
  };

  const filteredCollections = selectedCategory === 'all'
    ? collections
    : collections.filter(c => c.category === selectedCategory);

  const groupedCollections = filteredCollections.reduce((acc, collection) => {
    if (!acc[collection.category]) {
      acc[collection.category] = [];
    }
    acc[collection.category].push(collection);
    return acc;
  }, {} as { [key: string]: Collection[] });

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Collections" />
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Collections" />
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Collections" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
              Collections Management
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Organize products into curated collections for better discovery
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={openCreateModal}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 whitespace-nowrap"
            >
              + Add Collection
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Collections</p>
            <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-300">{collections.length}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Active</p>
            <p className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-300">
              {collections.filter(c => c.isActive).length}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Featured</p>
            <p className="mt-1 text-2xl font-semibold text-amber-900 dark:text-amber-300">
              {collections.filter(c => c.isFeatured).length}
            </p>
          </div>
        </div>

        {/* Collections by Category */}
        <div className="space-y-6">
          {Object.entries(groupedCollections).map(([category, cols]) => {
            const isExpanded = expandedCategory === category;
            return (
              <div key={category} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                    >
                      <svg
                        className={`h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {CATEGORY_LABELS[category]?.label || category}
                      </h4>
                    </button>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {cols.length} {cols.length === 1 ? 'collection' : 'collections'}
                    </span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" className="px-6 py-3">Collection Name</th>
                          <th scope="col" className="px-6 py-3">Description</th>
                          <th scope="col" className="px-6 py-3 text-center">Products</th>
                          <th scope="col" className="px-6 py-3 text-center">Display Order</th>
                          <th scope="col" className="px-6 py-3 text-center">Status</th>
                          <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cols.sort((a, b) => a.displayOrder - b.displayOrder).map((collection) => (
                          <tr key={collection.id} className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{collection.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {collection.id}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="line-clamp-2 text-gray-600 dark:text-gray-400">{collection.description}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                {collection.productCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-gray-900 dark:text-white">{collection.displayOrder}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-center gap-1">
                                {collection.isActive ? (
                                  <span className="rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                    Active
                                  </span>
                                ) : (
                                  <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    Inactive
                                  </span>
                                )}
                                {collection.isFeatured && (
                                  <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleRecalculateCount(collection.id)}
                                  disabled={recalculating === collection.id}
                                  title="Recalculate product count"
                                  className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                  {recalculating === collection.id ? (
                                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  ) : (
                                    'Sync'
                                  )}
                                </button>
                                <button
                                  onClick={() => openEditModal(collection)}
                                  title="Edit collection"
                                  className="rounded-lg bg-green-700 px-3 py-2 text-xs font-medium text-white hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => openDeleteModal(collection)}
                                  title="Delete collection"
                                  className="rounded-lg bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCollections.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-gray-500 dark:text-gray-400">No collections found in this category.</p>
          </div>
        )}
      </div>

      {/* Modal Components */}
      <CollectionForm
        isOpen={showModal}
        collection={editingCollection}
        onSave={handleSave}
        onCancel={() => setShowModal(false)}
      />
      
      <DeleteCollectionModal
        isOpen={showDeleteModal}
        collection={deletingCollection}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}