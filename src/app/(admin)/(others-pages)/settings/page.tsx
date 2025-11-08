"use client";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <PageBreadCrumb pageTitle="Settings" />
      
      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Configure your application settings and preferences here.
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                General Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Manage general application settings and configurations.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Security Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configure security preferences and authentication settings.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Notification Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Manage how and when you receive notifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}