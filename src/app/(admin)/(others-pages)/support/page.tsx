"use client";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export default function SupportPage() {
  return (
    <div className="container mx-auto p-6">
      <PageBreadCrumb pageTitle="Support" />
      
      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Support Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Get help and find answers to your questions. Our support team is here to assist you.
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                📚 Knowledge Base
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Browse our comprehensive documentation and frequently asked questions.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Browse Articles
              </button>
            </div>
            
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                💬 Contact Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Need personalized help? Get in touch with our support team.
              </p>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Start Chat
              </button>
            </div>
            
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🎥 Video Tutorials
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Watch step-by-step video guides to learn how to use features.
              </p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Watch Videos
              </button>
            </div>
            
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🐛 Report a Bug
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Found an issue? Help us improve by reporting bugs or suggesting features.
              </p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Report Issue
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Contact Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email</p>
                <p className="text-gray-600 dark:text-gray-300">support@everythingscents.com</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                <p className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Hours</p>
                <p className="text-gray-600 dark:text-gray-300">Mon-Fri 9AM-6PM EST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}