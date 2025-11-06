import { FirestoreService, QueryCondition } from "../../firebase/firestore";
import { ServiceResponse, ServiceUtils, PaginatedResult, PaginationOptions } from "../common/types";
import { Product, ProductFilter, ProductCreateInput, ProductUpdateInput } from "./types";

const COLLECTION_NAME = "products";

export class ProductService {
  // Create a new product
  static async createProduct(productData: ProductCreateInput): Promise<ServiceResponse<string>> {
    try {
      const sanitizedData = ServiceUtils.sanitizeData(productData);
      const productId = await FirestoreService.create(COLLECTION_NAME, sanitizedData);
      
      return ServiceUtils.createSuccessResponse(productId, "Product created successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "create product");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get product by ID
  static async getProductById(id: string): Promise<ServiceResponse<Product | null>> {
    try {
      const product = await FirestoreService.getById(COLLECTION_NAME, id) as Product | null;
      
      return ServiceUtils.createSuccessResponse(product);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get product");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Update product
  static async updateProduct(id: string, updateData: ProductUpdateInput): Promise<ServiceResponse<boolean>> {
    try {
      const sanitizedData = ServiceUtils.sanitizeData(updateData);
      const success = await FirestoreService.update(COLLECTION_NAME, id, sanitizedData);
      
      return ServiceUtils.createSuccessResponse(success, "Product updated successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "update product");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Delete product
  static async deleteProduct(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const success = await FirestoreService.delete(COLLECTION_NAME, id);
      
      return ServiceUtils.createSuccessResponse(success, "Product deleted successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "delete product");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get all products with optional filters
  static async getProducts(
    filter?: ProductFilter,
    pagination?: PaginationOptions
  ): Promise<ServiceResponse<Product[]>> {
    try {
      const conditions = this.buildQueryConditions(filter);
      
      const products = await FirestoreService.query(
        COLLECTION_NAME,
        conditions,
        pagination?.orderBy || 'createdAt',
        pagination?.orderDirection || 'desc',
        pagination?.limit
      ) as Product[];

      return ServiceUtils.createSuccessResponse(products);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get products");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get paginated products
  static async getProductsPaginated(
    pageSize: number = 20,
    lastDoc?: unknown,
    filter?: ProductFilter
  ): Promise<ServiceResponse<PaginatedResult<Product>>> {
    try {
      const conditions = this.buildQueryConditions(filter);
      
      const result = await FirestoreService.queryPaginated(
        COLLECTION_NAME,
        pageSize,
        lastDoc as import("firebase/firestore").QueryDocumentSnapshot<import("firebase/firestore").DocumentData>,
        conditions,
        'createdAt'
      );

      const paginatedResult: PaginatedResult<Product> = {
        data: result.docs as Product[],
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
      };

      return ServiceUtils.createSuccessResponse(paginatedResult);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get paginated products");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get featured products
  static async getFeaturedProducts(limit: number = 10): Promise<ServiceResponse<Product[]>> {
    try {
      const conditions: QueryCondition[] = [
        { field: "isFeatured", operator: "==", value: true },
        { field: "isActive", operator: "==", value: true }
      ];

      const products = await FirestoreService.query(
        COLLECTION_NAME,
        conditions,
        'createdAt',
        'desc',
        limit
      ) as Product[];

      return ServiceUtils.createSuccessResponse(products);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get featured products");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Search products by name or description
  static async searchProducts(searchTerm: string): Promise<ServiceResponse<Product[]>> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - consider using Algolia or similar for better search
      const allProducts = await FirestoreService.getAll(COLLECTION_NAME) as Product[];
      
      const searchResults = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return ServiceUtils.createSuccessResponse(searchResults);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "search products");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get products by category
  static async getProductsByCategory(categoryId: string): Promise<ServiceResponse<Product[]>> {
    try {
      const conditions: QueryCondition[] = [
        { field: "categoryId", operator: "==", value: categoryId },
        { field: "isActive", operator: "==", value: true }
      ];

      const products = await FirestoreService.query(
        COLLECTION_NAME,
        conditions,
        'name',
        'asc'
      ) as Product[];

      return ServiceUtils.createSuccessResponse(products);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get products by category");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Update product stock
  static async updateProductStock(id: string, newStock: number): Promise<ServiceResponse<boolean>> {
    try {
      const success = await FirestoreService.update(COLLECTION_NAME, id, { stock: newStock });
      
      return ServiceUtils.createSuccessResponse(success, "Product stock updated successfully");
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "update product stock");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Get low stock products
  static async getLowStockProducts(): Promise<ServiceResponse<Product[]>> {
    try {
      // Get all products and filter client-side since Firestore doesn't support field comparisons
      const allProducts = await FirestoreService.getAll(COLLECTION_NAME) as Product[];
      
      const lowStockProducts = allProducts.filter(product => {
        const minStock = product.minStock || 10; // Default min stock of 10
        return product.stock <= minStock && product.isActive;
      });

      return ServiceUtils.createSuccessResponse(lowStockProducts);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, "get low stock products");
      return ServiceUtils.createErrorResponse(errorMessage);
    }
  }

  // Private helper method to build query conditions
  private static buildQueryConditions(filter?: ProductFilter): QueryCondition[] {
    if (!filter) return [];

    const conditions: QueryCondition[] = [];

    if (filter.categoryId) {
      conditions.push({ field: "categoryId", operator: "==", value: filter.categoryId });
    }

    if (filter.subcategoryId) {
      conditions.push({ field: "subcategoryId", operator: "==", value: filter.subcategoryId });
    }

    if (filter.brand) {
      conditions.push({ field: "brand", operator: "==", value: filter.brand });
    }

    if (filter.scentType) {
      conditions.push({ field: "scentType", operator: "==", value: filter.scentType });
    }

    if (filter.gender) {
      conditions.push({ field: "gender", operator: "==", value: filter.gender });
    }

    if (filter.isActive !== undefined) {
      conditions.push({ field: "isActive", operator: "==", value: filter.isActive });
    }

    if (filter.isFeatured !== undefined) {
      conditions.push({ field: "isFeatured", operator: "==", value: filter.isFeatured });
    }

    if (filter.inStock !== undefined && filter.inStock) {
      conditions.push({ field: "stock", operator: ">", value: 0 });
    }

    // Note: Price range and tag filtering would need to be done client-side
    // since Firestore has limitations on range queries

    return conditions;
  }
}