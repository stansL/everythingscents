"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";

// Define the TypeScript interface for the top selling products
interface TopSellingProduct {
  id: number;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: string;
  stock: string;
  image: string;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
}

// Constants for data limiting
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

// Sample data pool (in production, this would come from your database)
const allTopSellingData: TopSellingProduct[] = [
  {
    id: 1,
    name: "Black Orchid",
    sku: "P001-BO",
    unitsSold: 352,
    revenue: "$42,240",
    stock: "In Stock",
    image: "/images/product/product-01.jpg",
    stockStatus: "In Stock",
  },
  {
    id: 2,
    name: "Dior Sauvage",
    sku: "P002-DS",
    unitsSold: 298,
    revenue: "$35,760",
    stock: "In Stock",
    image: "/images/product/product-02.jpg",
    stockStatus: "In Stock",
  },
  {
    id: 3,
    name: "Chanel No. 5",
    sku: "P003-C5",
    unitsSold: 215,
    revenue: "$32,250",
    stock: "Low Stock",
    image: "/images/product/product-03.jpg",
    stockStatus: "Low Stock",
  },
  {
    id: 4,
    name: "Acqua di Gio",
    sku: "P004-AG",
    unitsSold: 180,
    revenue: "$15,300",
    stock: "Out of Stock",
    image: "/images/product/product-04.jpg",
    stockStatus: "Out of Stock",
  },
  // Additional sample data to demonstrate limiting
  {
    id: 5,
    name: "Tom Ford Oud Wood",
    sku: "P005-TF",
    unitsSold: 165,
    revenue: "$24,750",
    stock: "In Stock",
    image: "/images/product/product-05.jpg",
    stockStatus: "In Stock",
  },
  {
    id: 6,
    name: "Creed Aventus",
    sku: "P006-CR",
    unitsSold: 142,
    revenue: "$21,300",
    stock: "Low Stock",
    image: "/images/product/product-01.jpg",
    stockStatus: "Low Stock",
  },
  {
    id: 7,
    name: "Bleu de Chanel",
    sku: "P007-BC",
    unitsSold: 128,
    revenue: "$19,200",
    stock: "In Stock",
    image: "/images/product/product-02.jpg",
    stockStatus: "In Stock",
  },
  {
    id: 8,
    name: "YSL Black Opium",
    sku: "P008-YS",
    unitsSold: 95,
    revenue: "$14,250",
    stock: "Out of Stock",
    image: "/images/product/product-03.jpg",
    stockStatus: "Out of Stock",
  },
];

// Simulate fetching top selling products with limit
const fetchTopSellingProducts = async (limit: number = DEFAULT_LIMIT): Promise<TopSellingProduct[]> => {
  // In production, this would be a real API call with SQL LIMIT or similar
  // Example: SELECT * FROM products ORDER BY units_sold DESC LIMIT ${limit}
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(allTopSellingData.slice(0, limit));
    }, 100); // Simulate network delay
  });
};

export default function TopSellingProducts() {
  const [products, setProducts] = useState<TopSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(DEFAULT_LIMIT);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [currentLimit]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchTopSellingProducts(currentLimit);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAll = () => {
    if (showAll) {
      setCurrentLimit(DEFAULT_LIMIT);
      setShowAll(false);
    } else {
      setCurrentLimit(MAX_LIMIT);
      setShowAll(true);
    }
  };
  const getStockBadgeColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Low Stock":
        return "warning";
      case "Out of Stock":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Top Selling Products
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview of your best performing products
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
            </svg>
            Filter
          </button>
          <button 
            onClick={handleSeeAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            {showAll ? "Show Less" : "See All"}
            {!showAll && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({allTopSellingData.length})
              </span>
            )}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Product Name
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Units Sold
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                >
                  Revenue
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Stock
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="border-gray-100 dark:border-gray-800">
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                          {product.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.sku}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {product.unitsSold.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-end">
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {product.revenue}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge color={getStockBadgeColor(product.stockStatus) as any}>
                      {product.stockStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!loading && products.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
        </div>
      )}
    </div>
  );
}