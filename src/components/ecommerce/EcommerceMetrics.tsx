"use client";
import React from "react";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon, DollarLineIcon, ShootingStarIcon } from "@/icons";

// Enhanced sparkline component with curved lines and hover tooltips
const MiniSparkline = ({ data, color }: { data: number[], color: string }) => {
  const [hoveredPoint, setHoveredPoint] = React.useState<{x: number, y: number, value: number} | null>(null);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  // Create smooth curve path using quadratic curves
  const createSmoothPath = (points: {x: number, y: number}[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (next) {
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) * 0.5;
        const cp2y = curr.y;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((value - min) / range) * 100,
    value
  }));

  const smoothPath = createSmoothPath(points);
  const areaPath = `${smoothPath} L 100 100 L 0 100 Z`;

  return (
    <div className="relative h-8 w-full mt-2">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Gradient area */}
        <path
          fill={`url(#gradient-${color.replace('#', '')})`}
          d={areaPath}
        />
        
        {/* Smooth trend line */}
        <path
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d={smoothPath}
        />
        
        {/* Invisible hover areas */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="8"
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint({x: point.x, y: point.y, value: point.value})}
          />
        ))}
        
        {/* Hover dot */}
        {hoveredPoint && (
          <circle
            cx={hoveredPoint.x}
            cy={hoveredPoint.y}
            r="3"
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
        )}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
          style={{
            left: `${hoveredPoint.x}%`,
            top: '-30px',
            transform: 'translateX(-50%)'
          }}
        >
          {hoveredPoint.value.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export const EcommerceMetrics = () => {
  // Sample 7-day data for each metric (last 7 days)
  const customersData = [520, 580, 640, 720, 680, 750, 782];
  const ordersData = [890, 920, 850, 980, 1020, 950, 859];
  const salesData = [28500, 31200, 29800, 34200, 32100, 30800, 34945];
  const incomeData = [19200, 21800, 20400, 24100, 22600, 21200, 24670];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {/* <!-- Customers Card --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: '#10B981' }}>
            <GroupIcon className="text-white size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Customers
              </span>
              <div className="flex items-center gap-0.5 text-green-600 text-xs font-medium">
                <ArrowUpIcon className="size-2.5" />
                11.01%
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              3,782
            </h4>
          </div>
        </div>
        <MiniSparkline data={customersData} color="#10B981" />
      </div>
      
      {/* <!-- Orders Card --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: '#EF4444' }}>
            <BoxIconLine className="text-white size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Orders
              </span>
              <div className="flex items-center gap-0.5 text-red-600 text-xs font-medium">
                <ArrowDownIcon className="size-2.5" />
                9.05%
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              5,359
            </h4>
          </div>
        </div>
        <MiniSparkline data={ordersData} color="#EF4444" />
      </div>

      {/* <!-- Total Sales Card --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: '#10B981' }}>
            <DollarLineIcon className="text-white size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Total Sales
              </span>
              <div className="flex items-center gap-0.5 text-green-600 text-xs font-medium">
                <ArrowUpIcon className="size-2.5" />
                15.32%
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              34,945
            </h4>
          </div>
        </div>
        <MiniSparkline data={salesData} color="#10B981" />
      </div>

      {/* <!-- Total Income Card --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: '#10B981' }}>
            <ShootingStarIcon className="text-white size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Total Income
              </span>
              <div className="flex items-center gap-0.5 text-green-600 text-xs font-medium">
                <ArrowUpIcon className="size-2.5" />
                8.47%
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              24,670
            </h4>
          </div>
        </div>
        <MiniSparkline data={incomeData} color="#10B981" />
      </div>
    </div>
  );
};
