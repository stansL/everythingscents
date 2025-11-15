'use client';

import React from 'react';
import { WorkflowStatus } from '@/lib/services/invoices/types';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const getStatusColor = (status: WorkflowStatus): string => {
    switch (status) {
      case WorkflowStatus.DRAFT:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case WorkflowStatus.SENT:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case WorkflowStatus.PARTIALLY_PAID:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case WorkflowStatus.PAID:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case WorkflowStatus.OUT_FOR_DELIVERY:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case WorkflowStatus.DELIVERED:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case WorkflowStatus.PICKED_UP:
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      case WorkflowStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: WorkflowStatus): string => {
    switch (status) {
      case WorkflowStatus.DRAFT:
        return 'Draft';
      case WorkflowStatus.SENT:
        return 'Sent';
      case WorkflowStatus.PARTIALLY_PAID:
        return 'Partially Paid';
      case WorkflowStatus.PAID:
        return 'Paid';
      case WorkflowStatus.OUT_FOR_DELIVERY:
        return 'Out for Delivery';
      case WorkflowStatus.DELIVERED:
        return 'Delivered';
      case WorkflowStatus.PICKED_UP:
        return 'Picked Up';
      case WorkflowStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default WorkflowStatusBadge;
