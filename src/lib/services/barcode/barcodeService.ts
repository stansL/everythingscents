import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface ScanResult {
  success: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode: string;
    category: string;
    currentStock: number;
    reorderPoint: number;
    unitCost: number;
    sellingPrice: number;
  };
  error?: string;
}

export interface BarcodeData {
  format: string;
  text: string;
  rawBytes?: Uint8Array;
}

export interface ScannerConfig {
  enabledFormats: string[];
  enableTorch: boolean;
  enableAutoFocus: boolean;
  scanAreaPercentage: number;
  beepOnScan: boolean;
  vibrateOnScan: boolean;
}

export class BarcodeService {
  private static defaultConfig: ScannerConfig = {
    enabledFormats: [
      'CODE_128',
      'CODE_39',
      'CODE_93',
      'EAN_13',
      'EAN_8',
      'UPC_A',
      'UPC_E',
      'QR_CODE',
      'DATA_MATRIX'
    ],
    enableTorch: false,
    enableAutoFocus: true,
    scanAreaPercentage: 60,
    beepOnScan: true,
    vibrateOnScan: true
  };

  /**
   * Look up a product by barcode
   */
  static async lookupProductByBarcode(barcode: string): Promise<ScanResult> {
    try {
      if (!barcode || barcode.trim() === '') {
        return {
          success: false,
          error: 'Invalid barcode'
        };
      }

      // Clean the barcode
      const cleanBarcode = barcode.trim().toUpperCase();

      // Query products by barcode
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('barcode', '==', cleanBarcode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Also try to find by SKU if barcode lookup fails
        const skuQuery = query(productsRef, where('sku', '==', cleanBarcode));
        const skuSnapshot = await getDocs(skuQuery);
        
        if (skuSnapshot.empty) {
          return {
            success: false,
            error: 'Product not found'
          };
        }
        
        const skuDoc = skuSnapshot.docs[0];
        const productData = skuDoc.data();
        
        return {
          success: true,
          product: {
            id: skuDoc.id,
            name: productData.name || '',
            sku: productData.sku || '',
            barcode: productData.barcode || '',
            category: productData.category || '',
            currentStock: productData.currentStock || 0,
            reorderPoint: productData.reorderPoint || 0,
            unitCost: productData.unitCost || 0,
            sellingPrice: productData.sellingPrice || 0
          }
        };
      }

      const doc = querySnapshot.docs[0];
      const productData = doc.data();

      return {
        success: true,
        product: {
          id: doc.id,
          name: productData.name || '',
          sku: productData.sku || '',
          barcode: productData.barcode || '',
          category: productData.category || '',
          currentStock: productData.currentStock || 0,
          reorderPoint: productData.reorderPoint || 0,
          unitCost: productData.unitCost || 0,
          sellingPrice: productData.sellingPrice || 0
        }
      };
    } catch (error) {
      console.error('Error looking up product by barcode:', error);
      return {
        success: false,
        error: 'Failed to lookup product'
      };
    }
  }

  /**
   * Validate barcode format
   */
  static validateBarcode(barcode: string, format?: string): boolean {
    if (!barcode || barcode.trim() === '') {
      return false;
    }

    const cleanBarcode = barcode.trim();

    // Basic validation based on format
    switch (format) {
      case 'EAN_13':
        return /^\d{13}$/.test(cleanBarcode);
      case 'EAN_8':
        return /^\d{8}$/.test(cleanBarcode);
      case 'UPC_A':
        return /^\d{12}$/.test(cleanBarcode);
      case 'UPC_E':
        return /^\d{8}$/.test(cleanBarcode);
      case 'CODE_128':
        return cleanBarcode.length >= 1 && cleanBarcode.length <= 128;
      case 'CODE_39':
        return /^[A-Z0-9\-. $\/+%]+$/.test(cleanBarcode);
      case 'QR_CODE':
        return cleanBarcode.length >= 1;
      default:
        // Generic validation - just check if it's not empty and reasonable length
        return cleanBarcode.length >= 1 && cleanBarcode.length <= 128;
    }
  }

  /**
   * Get scanner configuration
   */
  static getScannerConfig(): ScannerConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update scanner configuration
   */
  static updateScannerConfig(config: Partial<ScannerConfig>): ScannerConfig {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    return this.getScannerConfig();
  }

  /**
   * Check if device supports barcode scanning
   */
  static async checkScannerSupport(): Promise<{
    supported: boolean;
    cameras: MediaDeviceInfo[];
    error?: string;
  }> {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          supported: false,
          cameras: [],
          error: 'Camera access not supported'
        };
      }

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');

      if (cameras.length === 0) {
        return {
          supported: false,
          cameras: [],
          error: 'No cameras found'
        };
      }

      return {
        supported: true,
        cameras
      };
    } catch (error) {
      console.error('Error checking scanner support:', error);
      return {
        supported: false,
        cameras: [],
        error: 'Failed to check camera support'
      };
    }
  }

  /**
   * Request camera permissions
   */
  static async requestCameraPermission(): Promise<{
    granted: boolean;
    error?: string;
  }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Prefer rear camera
        }
      });

      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());

      return { granted: true };
    } catch (error) {
      console.error('Camera permission denied:', error);
      return {
        granted: false,
        error: error instanceof Error ? error.message : 'Camera permission denied'
      };
    }
  }

  /**
   * Generate test barcode for development
   */
  static generateTestBarcode(): string {
    const formats = ['123456789012', 'TEST-PRODUCT-001', 'SC001'];
    return formats[Math.floor(Math.random() * formats.length)];
  }

  /**
   * Format barcode for display
   */
  static formatBarcodeForDisplay(barcode: string, format?: string): string {
    if (!barcode) return '';

    const clean = barcode.trim();

    switch (format) {
      case 'EAN_13':
        if (clean.length === 13) {
          return `${clean.slice(0, 1)} ${clean.slice(1, 7)} ${clean.slice(7, 13)}`;
        }
        break;
      case 'UPC_A':
        if (clean.length === 12) {
          return `${clean.slice(0, 1)} ${clean.slice(1, 6)} ${clean.slice(6, 11)} ${clean.slice(11)}`;
        }
        break;
      default:
        // For other formats, just return as-is
        return clean;
    }

    return clean;
  }

  /**
   * Play scan feedback (beep/vibrate)
   */
  static playScanFeedback(config: ScannerConfig = this.defaultConfig): void {
    if (config.beepOnScan) {
      // Create a simple beep sound
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    }

    if (config.vibrateOnScan && navigator.vibrate) {
      navigator.vibrate(100);
    }
  }
}