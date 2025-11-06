import { BaseEntity } from "../common/types";

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  sku: string;
  categoryId: string;
  subcategoryId?: string;
  brand: string;
  images: string[];
  thumbnail?: string;
  stock: number;
  minStock?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  scentProfile?: {
    topNotes: string[];
    middleNotes: string[];
    baseNotes: string[];
  };
  scentType: 'perfume' | 'cologne' | 'body-spray' | 'candle' | 'diffuser' | 'other';
  size: string; // e.g., "50ml", "100ml", "3 oz"
  gender: 'men' | 'women' | 'unisex';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  longevity?: 'light' | 'moderate' | 'long-lasting' | 'very-long-lasting';
  sillage?: 'intimate' | 'moderate' | 'strong' | 'enormous';
  rating?: number;
  reviewCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface ProductFilter {
  categoryId?: string;
  subcategoryId?: string;
  brand?: string;
  scentType?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  tags?: string[];
  season?: string;
  searchTerm?: string;
}

export type ProductCreateInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>;

export type ProductUpdateInput = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;