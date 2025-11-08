// Firebase core exports
export { default as app } from './firebase/config';
export { auth, db, storage, analytics } from './firebase/config';

// Firebase service exports
export { AuthService } from './firebase/auth';
export { FirestoreService } from './firebase/firestore';
export { StorageService } from './firebase/storage';

// Types exports
export type { QueryCondition, BatchOperation, BaseDocument } from './firebase/firestore';
export type { UploadProgress, FileMetadata } from './firebase/storage';

// Common service types
export type {
  BaseEntity,
  PaginationOptions,
  PaginatedResult,
  ServiceResponse
} from './services/common/types';
export { ServiceUtils } from './services/common/types';

// Product service exports
export { ProductService } from './services/products/productService';
export type {
  Product,
  ProductFilter,
  ProductCreateInput,
  ProductUpdateInput
} from './services/products/types';

// Utility exports
export { ImageUtils } from './utils/imageUtils';

// Order service types (service to be implemented)
export type {
  Order,
  OrderItem,
  ShippingAddress,
  BillingAddress,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderFilter,
  OrderCreateInput,
  OrderUpdateInput
} from './services/orders/types';