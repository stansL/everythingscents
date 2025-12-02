/**
 * Category Service
 * Manages hierarchical product categories with CRUD operations and tree management
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ServiceResponse, ServiceUtils } from '../common/types';
import { 
  Category, 
  CategoryData, 
  CategoryFilter, 
  CategoryNode, 
  CategoryBreadcrumb,
  CategoryMoveRequest,
  CategoryTreeStats
} from './types';

export class CategoryService {
  private static readonly COLLECTION = COLLECTIONS.CATEGORIES;

  /**
   * Generate URL-friendly slug from category name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Convert Firestore document to Category object
   */
  private static docToCategory(docData: Record<string, unknown>, docId: string): Category {
    return {
      id: docId,
      name: docData.name as string,
      description: docData.description as string | undefined,
      slug: docData.slug as string,
      parentId: (docData.parentId as string | null) || null,
      image: docData.image as string | undefined,
      icon: docData.icon as string | undefined,
      isActive: docData.isActive !== false,
      displayOrder: (docData.displayOrder as number) || 0,
      productCount: (docData.productCount as number) || 0,
      createdAt: (docData.createdAt as { toDate: () => Date })?.toDate() || new Date(),
      updatedAt: (docData.updatedAt as { toDate: () => Date })?.toDate() || new Date(),
    };
  }

  /**
   * Create a new category
   */
  static async createCategory(data: CategoryData): Promise<ServiceResponse<Category>> {
    try {
      // Generate slug if not provided
      const slug = data.slug || this.generateSlug(data.name);

      // Check if slug already exists
      const existingQuery = query(
        collection(db, this.COLLECTION),
        where('slug', '==', slug)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        return ServiceUtils.error('A category with this name already exists');
      }

      const now = Timestamp.now();
      const categoryData = {
        name: data.name,
        description: data.description || '',
        slug,
        parentId: data.parentId || null,
        image: data.image || '',
        icon: data.icon || '',
        isActive: data.isActive !== false,
        displayOrder: data.displayOrder || 0,
        productCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), categoryData);
      const category = this.docToCategory(categoryData, docRef.id);

      return ServiceUtils.success(category, 'Category created successfully');
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'create category');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Update an existing category
   */
  static async updateCategory(
    id: string, 
    data: Partial<CategoryData>
  ): Promise<ServiceResponse<Category>> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return ServiceUtils.error('Category not found');
      }

      // If name is being updated, regenerate slug
      if (data.name) {
        data.slug = this.generateSlug(data.name);
      }

      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, updateData);

      const updated = await getDoc(docRef);
      const docData = updated.data();
      if (!docData) {
        return ServiceUtils.error('Category not found after update');
      }
      const category = this.docToCategory(docData, updated.id);

      return ServiceUtils.success(category, 'Category updated successfully');
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'update category');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Delete a category (must not have children or products)
   */
  static async deleteCategory(id: string): Promise<ServiceResponse<void>> {
    try {
      // Check if category has children
      const childrenQuery = query(
        collection(db, this.COLLECTION),
        where('parentId', '==', id)
      );
      const children = await getDocs(childrenQuery);

      if (!children.empty) {
        return ServiceUtils.error('Cannot delete category with subcategories. Move or delete subcategories first.');
      }

      // Check if category has products
      const productsQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('categoryId', '==', id)
      );
      const products = await getDocs(productsQuery);

      if (!products.empty) {
        return ServiceUtils.error(`Cannot delete category with ${products.size} products. Reassign or delete products first.`);
      }

      const docRef = doc(db, this.COLLECTION, id);
      await deleteDoc(docRef);

      return ServiceUtils.success(undefined, 'Category deleted successfully');
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'delete category');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string): Promise<ServiceResponse<Category>> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return ServiceUtils.error('Category not found');
      }

      const category = this.docToCategory(docSnap.data(), docSnap.id);
      return ServiceUtils.success(category);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'get category');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Get all categories with optional filtering
   */
  static async getCategories(filter?: CategoryFilter): Promise<ServiceResponse<Category[]>> {
    try {
      let q = query(collection(db, this.COLLECTION));

      // Apply filters
      const conditions = [];
      
      if (filter?.isActive !== undefined) {
        conditions.push(where('isActive', '==', filter.isActive));
      }

      if (filter?.parentId !== undefined) {
        conditions.push(where('parentId', '==', filter.parentId));
      }

      // Add ordering
      conditions.push(orderBy('displayOrder', 'asc'));
      conditions.push(orderBy('name', 'asc'));

      if (conditions.length > 0) {
        q = query(collection(db, this.COLLECTION), ...conditions);
      }

      const snapshot = await getDocs(q);
      let categories = snapshot.docs.map(doc => this.docToCategory(doc.data(), doc.id));

      // Apply search filter in memory
      if (filter?.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        categories = categories.filter(cat => 
          cat.name.toLowerCase().includes(term) ||
          cat.description?.toLowerCase().includes(term)
        );
      }

      return ServiceUtils.success(categories);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'get categories');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Get top-level categories (parentId is null)
   */
  static async getTopLevelCategories(): Promise<ServiceResponse<Category[]>> {
    return this.getCategories({ parentId: null, isActive: true });
  }

  /**
   * Get subcategories of a parent category
   */
  static async getSubcategories(parentId: string): Promise<ServiceResponse<Category[]>> {
    return this.getCategories({ parentId, isActive: true });
  }

  /**
   * Build category tree structure
   */
  static async getCategoryTree(): Promise<ServiceResponse<CategoryNode[]>> {
    try {
      const response = await this.getCategories();
      if (!response.success || !response.data) {
        return ServiceUtils.error(response.message || 'Failed to fetch categories');
      }

      const categories = response.data;
      const categoryMap = new Map<string, CategoryNode>();

      // Initialize all categories as nodes
      categories.forEach((cat: Category) => {
        categoryMap.set(cat.id, {
          ...cat,
          children: [],
          level: 0,
          path: [],
        });
      });

      // Build tree structure
      const rootNodes: CategoryNode[] = [];

      categoryMap.forEach(node => {
        if (node.parentId === null) {
          rootNodes.push(node);
        } else if (categoryMap.has(node.parentId)) {
          const parent = categoryMap.get(node.parentId)!;
          parent.children.push(node);
          node.level = parent.level + 1;
          node.path = [...parent.path, parent.id];
        }
      });

      // Sort children by displayOrder
      const sortChildren = (nodes: CategoryNode[]) => {
        nodes.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
        nodes.forEach(node => {
          if (node.children.length > 0) {
            sortChildren(node.children);
          }
        });
      };

      sortChildren(rootNodes);

      return ServiceUtils.success(rootNodes);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'get category tree');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Get breadcrumb trail for a category
   */
  static async getCategoryBreadcrumb(categoryId: string): Promise<ServiceResponse<CategoryBreadcrumb[]>> {
    try {
      const breadcrumb: CategoryBreadcrumb[] = [];
      let currentId: string | null = categoryId;

      while (currentId) {
        const response = await this.getCategoryById(currentId);
        if (!response.success || !response.data) break;

        const category = response.data;
        breadcrumb.unshift({
          id: category.id,
          name: category.name,
          slug: category.slug,
        });

        currentId = category.parentId;
      }

      return ServiceUtils.success(breadcrumb);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'get category breadcrumb');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Move category to a new parent
   */
  static async moveCategoryToParent(request: CategoryMoveRequest): Promise<ServiceResponse<Category>> {
    try {
      const { categoryId, newParentId, newDisplayOrder } = request;

      // Validate: can't move category to itself or its descendants
      if (newParentId) {
        const breadcrumbResponse = await this.getCategoryBreadcrumb(newParentId);
        if (breadcrumbResponse.success && breadcrumbResponse.data) {
          const isDescendant = breadcrumbResponse.data.some((b: CategoryBreadcrumb) => b.id === categoryId);
          if (isDescendant) {
            return ServiceUtils.error('Cannot move category to its own descendant');
          }
        }
      }

      const updateData: Partial<CategoryData> = {
        parentId: newParentId,
      };

      if (newDisplayOrder !== undefined) {
        updateData.displayOrder = newDisplayOrder;
      }

      return await this.updateCategory(categoryId, updateData);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'move category');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Update display order of a category
   */
  static async updateDisplayOrder(categoryId: string, newOrder: number): Promise<ServiceResponse<Category>> {
    return await this.updateCategory(categoryId, { displayOrder: newOrder });
  }

  /**
   * Get category tree statistics
   */
  static async getCategoryTreeStats(): Promise<ServiceResponse<CategoryTreeStats>> {
    try {
      const response = await this.getCategoryTree();
      if (!response.success || !response.data) {
        return ServiceUtils.error(response.message || 'Failed to fetch category tree');
      }

      const tree = response.data;
      let totalCategories = 0;
      let maxDepth = 0;
      let categoriesWithProducts = 0;

      const traverse = (nodes: CategoryNode[], depth: number) => {
        nodes.forEach(node => {
          totalCategories++;
          maxDepth = Math.max(maxDepth, depth);
          if (node.productCount && node.productCount > 0) {
            categoriesWithProducts++;
          }
          if (node.children.length > 0) {
            traverse(node.children, depth + 1);
          }
        });
      };

      traverse(tree, 1);

      const stats: CategoryTreeStats = {
        totalCategories,
        topLevelCategories: tree.length,
        maxDepth,
        categoriesWithProducts,
      };

      return ServiceUtils.success(stats);
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'get category stats');
      return ServiceUtils.error(errorMessage);
    }
  }

  /**
   * Bulk update category display orders
   */
  static async bulkUpdateDisplayOrders(
    updates: { categoryId: string; displayOrder: number }[]
  ): Promise<ServiceResponse<void>> {
    try {
      const batch = writeBatch(db);

      updates.forEach(update => {
        const docRef = doc(db, this.COLLECTION, update.categoryId);
        batch.update(docRef, {
          displayOrder: update.displayOrder,
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();

      return ServiceUtils.success(undefined, 'Display orders updated successfully');
    } catch (error) {
      const errorMessage = ServiceUtils.handleError(error, 'bulk update display orders');
      return ServiceUtils.error(errorMessage);
    }
  }
}
