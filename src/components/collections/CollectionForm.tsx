"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Collection } from '@/lib/services/collectionService';
import { Modal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import { StorageService } from '@/lib/firebase/storage';

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

interface CollectionFormProps {
  isOpen: boolean;
  collection?: Collection | null;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function CollectionForm({ isOpen, collection, onSave, onCancel }: CollectionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'popular',
    tags: [],
    image: '',
    icon: '',
    displayOrder: 1,
    isActive: true,
    isFeatured: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description,
        category: collection.category,
        tags: collection.tags,
        image: collection.image || '',
        icon: collection.icon || '',
        displayOrder: collection.displayOrder,
        isActive: collection.isActive,
        isFeatured: collection.isFeatured,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'popular',
        tags: [],
        image: '',
        icon: '',
        displayOrder: 1,
        isActive: true,
        isFeatured: false,
      });
    }
  }, [collection]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const file = files[0]; // Only take first file
      
      // Create folder structure: collections/{category}/{slug}
      const timestamp = Date.now();
      const categoryFolder = formData.category || 'general';
      const collectionSlug = formData.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `collection-${timestamp}`;
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `collections/${categoryFolder}/${collectionSlug}/${fileName}`;
      
      // Upload to Firebase Storage
      await StorageService.uploadFile(filePath, file, {
        customMetadata: {
          collectionName: formData.name || '',
          category: formData.category,
          uploadedAt: new Date().toISOString(),
        }
      });
      
      // Get download URL
      const downloadURL = await StorageService.getDownloadURL(filePath);
      
      // Update form data with image URL
      setFormData(prev => ({
        ...prev,
        image: downloadURL
      }));
    } catch (err) {
      console.error('Image upload error:', err);
      setError(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="max-w-[700px] m-4">
      <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {collection ? 'Edit Collection' : 'Add Collection'}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {collection 
              ? 'Update your collection details to keep your products organized.'
              : 'Create a new collection to group related products together.'}
          </p>
        </div>

        {error && (
          <div className="mx-2 mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-2 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              {/* Name */}
              <div>
                <Label>
                  Collection Name <span className="text-red-500">*</span>
                </Label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Best Sellers"
                  required
                  className="h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              {/* Display Order */}
              <div>
                <Label>Display Order</Label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <Label>
                  Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-blue-500"
                  placeholder="Describe this collection..."
                />
              </div>

              {/* Category */}
              <div>
                <Label>
                  Category <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-blue-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags (comma-separated)</Label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  })}
                  placeholder="popular, trending, new"
                  className="h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              {/* Image Upload */}
              <div className="lg:col-span-2">
                <Label>Collection Image</Label>
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="collection-image-upload"
                    />
                    <label
                      htmlFor="collection-image-upload"
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {uploading ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upload Image
                        </>
                      )}
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">or enter URL below</span>
                  </div>

                  {/* Image Preview */}
                  {formData.image && (
                    <div className="relative inline-block">
                      <Image
                        src={formData.image}
                        alt="Collection preview"
                        width={128}
                        height={128}
                        className="h-32 w-32 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* URL Input */}
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              {/* Icon */}
              <div>
                <Label>Icon (Emoji or Icon Class)</Label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🔥 or ti-star"
                  className="h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-300"
                >
                  Active (visible on website)
                </label>
              </div>

              {/* Is Featured */}
              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                />
                <label
                  htmlFor="isFeatured"
                  className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-300"
                >
                  Featured (show on homepage)
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <button
              onClick={onCancel}
              type="button"
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              {loading ? 'Saving...' : collection ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
