"use client";
import React from "react";
import { Product } from "@/lib";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import ProductImage from "./ProductImage";

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const ProductViewModal: React.FC<ProductViewModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const formatPrice = (price: number, salePrice?: number) => {
    if (salePrice && salePrice < price) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg line-through text-gray-500">${price.toFixed(2)}</span>
          <span className="text-xl font-bold text-red-600">${salePrice.toFixed(2)}</span>
        </div>
      );
    }
    return <span className="text-xl font-bold text-gray-900 dark:text-white">${price.toFixed(2)}</span>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Details
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden mb-4">
              <ProductImage
                src={product.images?.[0]}
                alt={product.name}
                width={400}
                height={400}
                className="object-cover w-full h-full"
                fallbackClassName="aspect-square rounded-lg w-full h-full"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    <ProductImage
                      src={image}
                      alt={`${product.name} ${index + 2}`}
                      width={100}
                      height={100}
                      className="object-cover w-full h-full"
                      fallbackClassName="aspect-square rounded-lg w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {product.description}
              </p>
              <div className="flex items-center gap-4 mb-4">
                {formatPrice(product.price, product.salePrice)}
                <Badge color={product.isActive ? "success" : "error"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
                {product.isFeatured && (
                  <Badge color="primary">Featured</Badge>
                )}
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">SKU</h3>
                <p className="text-gray-600 dark:text-gray-400">{product.sku}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Brand</h3>
                <p className="text-gray-600 dark:text-gray-400">{product.brand}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Category</h3>
                <p className="text-gray-600 dark:text-gray-400">{product.categoryId}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Size</h3>
                <p className="text-gray-600 dark:text-gray-400">{product.size}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Stock</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {product.stock} units
                  {product.minStock && ` (Min: ${product.minStock})`}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Gender</h3>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{product.gender}</p>
              </div>
              {product.season && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Season</h3>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{product.season}</p>
                </div>
              )}
              {product.longevity && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Longevity</h3>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{product.longevity}</p>
                </div>
              )}
            </div>

            {/* Scent Profile */}
            {product.scentProfile && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Scent Profile</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Top Notes</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.scentProfile.topNotes.map((note, index) => (
                        <Badge key={index} variant="light" color="info" size="sm">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Middle Notes</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.scentProfile.middleNotes.map((note, index) => (
                        <Badge key={index} variant="light" color="warning" size="sm">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Base Notes</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.scentProfile.baseNotes.map((note, index) => (
                        <Badge key={index} variant="light" color="dark" size="sm">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="light" color="light" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div>Created: {product.createdAt ? new Date(product.createdAt.toDate()).toLocaleDateString() : "N/A"}</div>
                <div>Updated: {product.updatedAt ? new Date(product.updatedAt.toDate()).toLocaleDateString() : "N/A"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductViewModal;