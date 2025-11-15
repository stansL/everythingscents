'use client';

import React, { useState } from 'react';
import { DeliveryInfo } from '@/lib/services/invoices/types';

interface DeliveryStatusToggleProps {
  deliveryInfo: DeliveryInfo;
  onUpdate?: (updatedInfo: DeliveryInfo) => void;
  className?: string;
}

const DeliveryStatusToggle: React.FC<DeliveryStatusToggleProps> = ({
  deliveryInfo,
  onUpdate,
  className = '',
}) => {
  const [localInfo, setLocalInfo] = useState<DeliveryInfo>(deliveryInfo);
  const [isEditing, setIsEditing] = useState(false);

  const handleTypeChange = (type: 'pickup' | 'delivery') => {
    const updated = { ...localInfo, type };
    setLocalInfo(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleStatusChange = (status: 'pending' | 'out_for_delivery' | 'completed') => {
    const updated = {
      ...localInfo,
      status,
      completedDate: status === 'completed' ? new Date() : undefined,
    };
    setLocalInfo(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleScheduledDateChange = (date: string) => {
    const updated = {
      ...localInfo,
      scheduledDate: date ? new Date(date) : undefined,
    };
    setLocalInfo(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleFieldUpdate = (field: keyof DeliveryInfo, value: string) => {
    const updated = { ...localInfo, [field]: value };
    setLocalInfo(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  // Format date for input
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className={`rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-black dark:text-white">
          Delivery Information
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-primary hover:underline"
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* Delivery Type & Status - Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Delivery Type Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeChange('pickup')}
              disabled={!isEditing}
              className={`flex-1 rounded border py-2 px-3 text-sm font-medium transition ${
                localInfo.type === 'pickup'
                  ? 'border-primary bg-primary text-white'
                  : 'border-stroke bg-gray hover:border-primary dark:border-strokedark dark:bg-meta-4'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              Pickup
            </button>
            <button
              onClick={() => handleTypeChange('delivery')}
              disabled={!isEditing}
              className={`flex-1 rounded border py-2 px-3 text-sm font-medium transition ${
                localInfo.type === 'delivery'
                  ? 'border-primary bg-primary text-white'
                  : 'border-stroke bg-gray hover:border-primary dark:border-strokedark dark:bg-meta-4'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              Delivery
            </button>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="mb-2 block text-sm font-medium text-black dark:text-white">
            Status
          </label>
          <select
            value={localInfo.status}
            onChange={(e) => handleStatusChange(e.target.value as 'pending' | 'out_for_delivery' | 'completed')}
            disabled={!isEditing}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          >
            <option value="pending">Pending</option>
            {localInfo.type === 'delivery' && (
              <option value="out_for_delivery">Out for Delivery</option>
            )}
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Scheduled Date */}
      <div className="mb-3">
        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
          Scheduled Date
        </label>
        <input
          type="date"
          value={formatDateForInput(localInfo.scheduledDate)}
          onChange={(e) => handleScheduledDateChange(e.target.value)}
          disabled={!isEditing}
          className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
        />
      </div>

      {/* Recipient Information */}
      {isEditing && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Recipient Name
              </label>
              <input
                type="text"
                value={localInfo.recipientName || ''}
                onChange={(e) => handleFieldUpdate('recipientName', e.target.value)}
                placeholder="Name"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Phone
              </label>
              <input
                type="tel"
                value={localInfo.recipientPhone || ''}
                onChange={(e) => handleFieldUpdate('recipientPhone', e.target.value)}
                placeholder="Phone"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              />
            </div>
          </div>

          {localInfo.type === 'delivery' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Delivery Address
              </label>
              <textarea
                value={localInfo.address || ''}
                onChange={(e) => handleFieldUpdate('address', e.target.value)}
                placeholder="Delivery address"
                rows={2}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Notes
            </label>
            <textarea
              value={localInfo.notes || ''}
              onChange={(e) => handleFieldUpdate('notes', e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
            />
          </div>
        </div>
      )}

      {/* Display mode for recipient info */}
      {!isEditing && (localInfo.recipientName || localInfo.recipientPhone || localInfo.address || localInfo.notes) && (
        <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-meta-4">
          {localInfo.recipientName && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recipient:</p>
              <p className="text-sm font-medium text-black dark:text-white">{localInfo.recipientName}</p>
            </div>
          )}
          {localInfo.recipientPhone && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Phone:</p>
              <p className="text-sm font-medium text-black dark:text-white">{localInfo.recipientPhone}</p>
            </div>
          )}
          {localInfo.address && localInfo.type === 'delivery' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Address:</p>
              <p className="text-sm font-medium text-black dark:text-white">{localInfo.address}</p>
            </div>
          )}
          {localInfo.notes && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Notes:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{localInfo.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Completed Date (read-only) */}
      {localInfo.completedDate && (
        <div className="mt-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            Completed: {new Date(localInfo.completedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryStatusToggle;
