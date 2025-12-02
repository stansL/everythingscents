"use client";
import React from "react";
import { ProductCreateInput } from "@/lib/services/products/types";

interface ScentProfileSectionProps {
  formData: Partial<ProductCreateInput>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onScentProfileChange: (type: 'topNotes' | 'middleNotes' | 'baseNotes', value: string) => void;
}

export default function ScentProfileSection({
  formData,
  onInputChange,
  onScentProfileChange,
}: ScentProfileSectionProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Scent Profile
        </h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Top Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Top Notes
            </label>
            <input
              type="text"
              value={(formData.scentProfile?.topNotes || []).join(', ')}
              onChange={(e) => onScentProfileChange('topNotes', e.target.value)}
              placeholder="e.g., Bergamot, Lemon"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">First impression notes</p>
          </div>

          {/* Middle Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Middle Notes
            </label>
            <input
              type="text"
              value={(formData.scentProfile?.middleNotes || []).join(', ')}
              onChange={(e) => onScentProfileChange('middleNotes', e.target.value)}
              placeholder="e.g., Lavender, Rose"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Heart of the fragrance</p>
          </div>

          {/* Base Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base Notes
            </label>
            <input
              type="text"
              value={(formData.scentProfile?.baseNotes || []).join(', ')}
              onChange={(e) => onScentProfileChange('baseNotes', e.target.value)}
              placeholder="e.g., Sandalwood, Musk"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Lasting foundation notes</p>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <select
              name="season"
              value={formData.season || "year-round"}
              onChange={onInputChange}
              className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="year-round">Year Round</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
            </select>
          </div>

          {/* Longevity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Longevity
            </label>
            <select
              name="longevity"
              value={formData.longevity || "moderate"}
              onChange={onInputChange}
              className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="light">Light (1-3 hours)</option>
              <option value="moderate">Moderate (3-6 hours)</option>
              <option value="long-lasting">Long-lasting (6-12 hours)</option>
              <option value="very-long-lasting">Very Long-lasting (12+ hours)</option>
            </select>
          </div>

          {/* Sillage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sillage
            </label>
            <select
              name="sillage"
              value={formData.sillage || "moderate"}
              onChange={onInputChange}
              className="modern-dropdown w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="intimate">Intimate</option>
              <option value="moderate">Moderate</option>
              <option value="strong">Strong</option>
              <option value="enormous">Enormous</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
