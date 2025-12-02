"use client";
import React from "react";
import Image from "next/image";

interface ProductImageSectionProps {
  uploadedImages: string[];
  selectedThumbnail: string;
  imageUploading: boolean;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (imageUrl: string) => void;
  onThumbnailSelect: (imageUrl: string) => void;
}

export default function ProductImageSection({
  uploadedImages,
  selectedThumbnail,
  imageUploading,
  onImageUpload,
  onRemoveImage,
  onThumbnailSelect,
}: ProductImageSectionProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Product Images
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Upload Button */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
              <div className="flex flex-col items-center justify-center pt-4 pb-5">
                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> images
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG (MAX. 5MB)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                multiple 
                accept="image/*"
                onChange={onImageUpload}
                disabled={imageUploading}
              />
            </label>
          </div>

          {/* Loading State */}
          {imageUploading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
            </div>
          )}

          {/* Uploaded Images Grid */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {uploadedImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                    <Image
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    
                    {/* Thumbnail Badge */}
                    {selectedThumbnail === imageUrl && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                          Thumb
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => onThumbnailSelect(imageUrl)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full transition-colors"
                        title="Set as thumbnail"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveImage(imageUrl)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"
                        title="Remove image"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadedImages.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click ✓ to set thumbnail. {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} uploaded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
