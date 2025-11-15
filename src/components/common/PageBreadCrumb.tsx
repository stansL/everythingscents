import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string; // If no href, it's the current page
}

interface BreadcrumbProps {
  pageName?: string; // For backward compatibility
  pageTitle?: string; // Alternative prop name
  items?: BreadcrumbItem[]; // Optional multi-level breadcrumb items
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageName, pageTitle, items }) => {
  // Use pageName or pageTitle (pageName takes priority for backward compatibility)
  const title = pageName || pageTitle || "Page";
  
  // If no items provided, use simple Home > Current Page structure
  const breadcrumbItems = items || [
    { label: "Home", href: "/" },
    { label: title }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
        x-text="pageName"
      >
        {title}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <li>
                {item.href ? (
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    href={item.href}
                  >
                    {item.label}
                    {index < breadcrumbItems.length - 1 && (
                      <svg
                        className="stroke-current"
                        width="17"
                        height="16"
                        viewBox="0 0 17 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                          stroke=""
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
