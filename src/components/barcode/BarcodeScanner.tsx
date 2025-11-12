'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat } from '@zxing/library';
import { BarcodeService, ScanResult, ScannerConfig } from '../../lib/services/barcode/barcodeService';

interface BarcodeScannerProps {
  onScanSuccess: (result: ScanResult) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  isOpen: boolean;
  config?: Partial<ScannerConfig>;
}

interface ScannerState {
  isScanning: boolean;
  isCameraReady: boolean;
  error: string | null;
  lastScan: string | null;
  torchEnabled: boolean;
  selectedCamera: string | null;
  availableCameras: MediaDeviceInfo[];
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  onClose,
  isOpen,
  config = {}
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<ScannerState>({
    isScanning: false,
    isCameraReady: false,
    error: null,
    lastScan: null,
    torchEnabled: false,
    selectedCamera: null,
    availableCameras: []
  });

  const scannerConfig = useMemo(() => ({ ...BarcodeService.getScannerConfig(), ...config }), [config]);

  // Initialize camera and scanner
  const initializeScanner = async () => {
    try {
      setState(prev => ({ ...prev, error: null, isCameraReady: false }));

      // Check scanner support
      const support = await BarcodeService.checkScannerSupport();
      if (!support.supported) {
        setState(prev => ({ ...prev, error: support.error || 'Scanner not supported' }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        availableCameras: support.cameras,
        selectedCamera: support.cameras[0]?.deviceId || null
      }));

      // Request camera permission
      const permission = await BarcodeService.requestCameraPermission();
      if (!permission.granted) {
        setState(prev => ({ ...prev, error: permission.error || 'Camera permission denied' }));
        return;
      }

      // Initialize code reader
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
        
        // Set enabled formats
        const formats = scannerConfig.enabledFormats.map(format => {
          switch (format) {
            case 'CODE_128': return BarcodeFormat.CODE_128;
            case 'CODE_39': return BarcodeFormat.CODE_39;
            case 'CODE_93': return BarcodeFormat.CODE_93;
            case 'EAN_13': return BarcodeFormat.EAN_13;
            case 'EAN_8': return BarcodeFormat.EAN_8;
            case 'UPC_A': return BarcodeFormat.UPC_A;
            case 'UPC_E': return BarcodeFormat.UPC_E;
            case 'QR_CODE': return BarcodeFormat.QR_CODE;
            case 'DATA_MATRIX': return BarcodeFormat.DATA_MATRIX;
            default: return BarcodeFormat.CODE_128;
          }
        });
        
        codeReader.current.hints.set(2, formats); // DecodeHintType.POSSIBLE_FORMATS
      }

      setState(prev => ({ ...prev, isCameraReady: true }));
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize scanner',
        isCameraReady: false
      }));
      onScanError?.('Failed to initialize scanner');
    }
  };

  // Start scanning
  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current || scanningRef.current) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isScanning: true, error: null }));
      scanningRef.current = true;

      const selectedDeviceId = state.selectedCamera || state.availableCameras[0]?.deviceId;
      
      if (!selectedDeviceId) {
        throw new Error('No camera available');
      }

      // Start decoding from video element
      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result && scanningRef.current) {
            handleScanResult(result.getText());
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error);
          }
        }
      );

    } catch (error) {
      console.error('Start scanning error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start scanning',
        isScanning: false
      }));
      scanningRef.current = false;
      onScanError?.('Failed to start scanning');
    }
  };

  // Stop scanning  
  const stopScanning = () => {
    scanningRef.current = false;
    
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isScanning: false,
      torchEnabled: false
    }));
  };

  // Handle scan result
  const handleScanResult = async (barcode: string) => {
    if (!barcode || barcode === state.lastScan) {
      return;
    }

    setState(prev => ({ ...prev, lastScan: barcode }));

    // Play feedback
    BarcodeService.playScanFeedback(scannerConfig);

    // Look up product
    const result = await BarcodeService.lookupProductByBarcode(barcode);
    onScanSuccess(result);

    // Briefly stop scanning to prevent multiple scans of the same code
    setTimeout(() => {
      setState(prev => ({ ...prev, lastScan: null }));
    }, 2000);
  };

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        await track.applyConstraints({
          advanced: [{ torch: !state.torchEnabled } as MediaTrackConstraintSet]
        });
        setState(prev => ({ ...prev, torchEnabled: !prev.torchEnabled }));
      }
    } catch (error) {
      console.error('Torch toggle error:', error);
    }
  };

  // Switch camera
  const switchCamera = (deviceId: string) => {
    setState(prev => ({ ...prev, selectedCamera: deviceId }));
    if (state.isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 100);
    }
  };

  // Initialize when component mounts or opens
  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    }
    
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Start scanning when camera is ready
  useEffect(() => {
    if (isOpen && state.isCameraReady && !state.isScanning && !state.error) {
      startScanning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, state.isCameraReady, state.isScanning, state.error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Barcode
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Point camera at product barcode
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{state.error}</p>
            <button
              onClick={initializeScanner}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Camera Controls */}
        {state.isCameraReady && !state.error && (
          <div className="mb-4 flex flex-wrap gap-2">
            {/* Camera Selection */}
            {state.availableCameras.length > 1 && (
              <select
                value={state.selectedCamera || ''}
                onChange={(e) => switchCamera(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {state.availableCameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* Torch Toggle */}
            <button
              onClick={toggleTorch}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                state.torchEnabled
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {state.torchEnabled ? '🔦 On' : '🔦 Off'}
            </button>
          </div>
        )}

        {/* Camera Preview */}
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-black"
            style={{ aspectRatio: '4/3' }}
            playsInline
            muted
          />

          {/* Scan Area Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute border-2 border-white border-dashed rounded-lg"
              style={{
                left: `${(100 - scannerConfig.scanAreaPercentage) / 2}%`,
                right: `${(100 - scannerConfig.scanAreaPercentage) / 2}%`,
                top: `${(100 - scannerConfig.scanAreaPercentage) / 2}%`,
                bottom: `${(100 - scannerConfig.scanAreaPercentage) / 2}%`,
              }}
            />
          </div>

          {/* Scanning Status */}
          {state.isScanning && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                Scanning...
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Option */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Can&apos;t scan? Enter barcode manually:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter barcode or SKU"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    handleScanResult(value);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Enter barcode or SKU"]') as HTMLInputElement;
                if (input?.value.trim()) {
                  handleScanResult(input.value.trim());
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Lookup
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Position the barcode within the scanning area
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;