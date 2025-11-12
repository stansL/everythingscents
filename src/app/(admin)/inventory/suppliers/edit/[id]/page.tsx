'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SupplierForm } from '@/components/inventory/SupplierForm';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { SupplierService } from '@/lib/services/inventory/supplierService';
import type { Supplier } from '@/lib/services/products/types';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!supplierId) return;
      
      try {
        setLoading(true);
        const response = await SupplierService.getSupplierById(supplierId);
        if (response.success && response.data) {
          setSupplier(response.data);
        } else {
          setError(response.error || 'Supplier not found');
        }
      } catch (err) {
        setError('Failed to load supplier');
        console.error('Error loading supplier:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId]);



  const handleSuccess = () => {
    // Navigate back to suppliers list after successful update
    router.push('/inventory/suppliers');
  };

  const handleCancel = () => {
    // Navigate back to suppliers list on cancel
    router.push('/inventory/suppliers');
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Edit Supplier" />
        <ComponentCard title="Error">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || 'Supplier not found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The supplier you&apos;re looking for might have been deleted or doesn&apos;t exist.
            </p>
            <button
              onClick={() => router.push('/inventory/suppliers')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Suppliers
            </button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Supplier
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update supplier information and contact details
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <PageBreadCrumb pageTitle="Edit Supplier" />

      {/* Form Container */}
      <ComponentCard title={`Edit ${supplier.name}`}>
        <div className="max-w-4xl">
          <SupplierForm
            supplier={supplier}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            mode="edit"
          />
        </div>
      </ComponentCard>
    </div>
  );
}