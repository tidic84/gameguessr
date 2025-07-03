'use client';

import { motion } from 'framer-motion';
import { loadingShimmerAnimation } from '@/utils/animations';

interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangle' | 'circle' | 'button' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  repeat?: number;
}

export default function SkeletonLoader({
  variant = 'rectangle',
  width,
  height,
  className = '',
  repeat = 1
}: SkeletonLoaderProps) {
  const baseStyle = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%]';
  
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded-md';
      case 'circle':
        return 'rounded-full aspect-square';
      case 'button':
        return 'h-10 rounded-md';
      case 'card':
        return 'rounded-lg h-40';
      case 'rectangle':
      default:
        return 'rounded-md';
    }
  };
  
  const SkeletonItem = () => (
    <motion.div
      className={`${baseStyle} ${getVariantStyles()} ${className}`}
      style={{
        width: width || '100%',
        height: height,
      }}
      variants={loadingShimmerAnimation}
      initial="initial"
      animate="animate"
    />
  );
  
  if (repeat === 1) {
    return <SkeletonItem />;
  }
  
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: repeat }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 1, width = '100%', className = '' }: { lines?: number; width?: string | number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] h-4 rounded-md"
          style={{
            width: typeof width === 'number' 
              ? `${width}%` 
              : Array.isArray(width) 
                ? `${width[index % width.length]}%` 
                : width === 'random' 
                  ? `${Math.floor(70 + Math.random() * 30)}%` 
                  : width
          }}
          variants={loadingShimmerAnimation}
          initial="initial"
          animate="animate"
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg overflow-hidden shadow-md ${className}`}>
      {/* Image */}
      <SkeletonLoader variant="rectangle" height={200} />
      
      {/* Content */}
      <div className="p-4 space-y-4">
        <SkeletonLoader variant="text" width="70%" />
        <TextSkeleton lines={3} width="random" />
        <div className="flex gap-2 pt-2">
          <SkeletonLoader variant="button" width={100} />
          <SkeletonLoader variant="button" width={100} />
        </div>
      </div>
    </div>
  );
}

export function AvatarWithTextSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SkeletonLoader variant="circle" width={40} height={40} />
      <div className="space-y-2">
        <SkeletonLoader variant="text" width={120} />
        <SkeletonLoader variant="text" width={180} />
      </div>
    </div>
  );
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className = '' 
}: { 
  rows?: number; 
  columns?: number; 
  showHeader?: boolean;
  className?: string 
}) {
  return (
    <div className={`w-full ${className}`}>
      {showHeader && (
        <div className="flex gap-2 mb-2">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={`header-${index}`} className="flex-1">
              <SkeletonLoader variant="text" />
            </div>
          ))}
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1">
                <SkeletonLoader variant="text" width="random" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
