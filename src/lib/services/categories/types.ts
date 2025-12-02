/**
 * Category Types and Interfaces
 * Defines the structure for hierarchical product categories
 */

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId: string | null; // null = top-level category
  image?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
  path: string[]; // Array of category IDs from root to this node
}

export interface CategoryData {
  name: string;
  description?: string;
  slug?: string;
  parentId?: string | null;
  image?: string;
  icon?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CategoryFilter {
  isActive?: boolean;
  parentId?: string | null;
  searchTerm?: string;
  includeProductCount?: boolean;
}

export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryMoveRequest {
  categoryId: string;
  newParentId: string | null;
  newDisplayOrder?: number;
}

export interface CategoryTreeStats {
  totalCategories: number;
  topLevelCategories: number;
  maxDepth: number;
  categoriesWithProducts: number;
}
