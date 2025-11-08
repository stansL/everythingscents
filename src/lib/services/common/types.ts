import { Timestamp } from "firebase/firestore";

// Common interfaces for all services
export interface BaseEntity {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PaginationOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: unknown;
}

// Service response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Common utility functions for services
export class ServiceUtils {
  static createSuccessResponse<T>(data: T, message?: string): ServiceResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static createErrorResponse<T>(error: string): ServiceResponse<T> {
    return {
      success: false,
      error,
    };
  }

  static handleError(error: unknown, operation: string): string {
    console.error(`Error in ${operation}:`, error);
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return `An unexpected error occurred during ${operation}`;
  }

  static sanitizeData<T>(data: T): T {
    // Remove undefined values and ensure clean data
    const sanitized = JSON.parse(JSON.stringify(data));
    return sanitized;
  }
}

export default ServiceUtils;