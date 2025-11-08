import { StorageService } from '../firebase/storage';

export class ImageUtils {
  /**
   * Upload product image to Firebase Storage
   * @param file - The image file to upload
   * @param productId - The product ID for organizing images
   * @returns Promise with the download URL
   */
  static async uploadProductImage(file: File, productId: string): Promise<string> {
    const path = `products/${productId}/${Date.now()}_${file.name}`;
    await StorageService.uploadFile(path, file);
    const downloadURL = await StorageService.getDownloadURL(path);
    
    return downloadURL;
  }

  /**
   * Delete product image from Firebase Storage
   * @param imageUrl - The full URL of the image to delete
   */
  static async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Extract the path from the Firebase Storage URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (pathMatch) {
        const path = decodeURIComponent(pathMatch[1]);
        await StorageService.deleteFile(path);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error as image deletion is not critical
    }
  }

  /**
   * Get optimized image URL for display
   * @param originalUrl - Original image URL
   * @param size - Desired size ('thumbnail' | 'medium' | 'large')
   * @returns Optimized image URL or placeholder
   */
  static getOptimizedImageUrl(originalUrl: string, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
    if (!originalUrl) {
      return this.getPlaceholderImage(size);
    }

    // For Firebase Storage URLs, you can add transformation parameters
    // This is a basic implementation - you might want to use a service like Cloudinary
    if (originalUrl.includes('firebasestorage.googleapis.com')) {
      // Note: Firebase Storage doesn't support URL transformations by default
      // You might want to integrate with Cloudinary or similar service
      return originalUrl;
    }

    return originalUrl;
  }

  /**
   * Get placeholder image URL
   * @param size - Size of placeholder
   * @returns Placeholder image URL
   */
  static getPlaceholderImage(size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
    const dimensions = {
      thumbnail: '150x150',
      medium: '400x400',
      large: '800x800'
    };

    return `https://via.placeholder.com/${dimensions[size]}/f3f4f6/9ca3af?text=No+Image`;
  }

  /**
   * Validate image file
   * @param file - File to validate
   * @returns Validation result
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF images only.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Please upload images smaller than 5MB.'
      };
    }

    return { isValid: true };
  }

  /**
   * Create a preview URL for a file
   * @param file - File to create preview for
   * @returns Preview URL
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Cleanup preview URL
   * @param url - URL to cleanup
   */
  static cleanupPreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}