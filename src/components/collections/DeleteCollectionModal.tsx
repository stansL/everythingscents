"use client";

import React, { useState } from 'react';
import { Collection } from '@/lib/services/collectionService';
import { Modal } from '@/components/ui/modal';

interface DeleteCollectionModalProps {
  isOpen: boolean;
  collection: Collection | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteCollectionModal({ 
  isOpen, 
  collection, 
  onConfirm, 
  onCancel 
}: DeleteCollectionModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    } finally {
      setDeleting(false);
    }
  };

  if (!collection) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="max-w-[500px] m-4">
      <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-red-600 dark:text-red-400">
            Confirm Delete
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            This action cannot be undone.
          </p>
        </div>

        {error && (
          <div className="mx-2 mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="px-2 mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Are you sure you want to delete the collection:
          </p>
          <p className="font-semibold text-gray-900 dark:text-white text-lg mb-3">
            {collection.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will remove the collection but won&apos;t delete the products. 
            Current products: <span className="font-medium">{collection.productCount}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 px-2 lg:justify-end">
          <button
            onClick={onCancel}
            type="button"
            disabled={deleting}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            type="button"
            disabled={deleting}
            className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
          >
            {deleting ? 'Deleting...' : 'Delete Collection'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
