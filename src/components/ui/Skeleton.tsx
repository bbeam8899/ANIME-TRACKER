import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-800/60 ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(30, 41, 59, 0.4) 0%, rgba(51, 65, 85, 0.4) 50%, rgba(30, 41, 59, 0.4) 100%)',
        backgroundSize: '200% 100%',
        animation: 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-slate-800 p-3 h-full flex flex-col space-y-3">
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex space-x-1 pt-1">
        <Skeleton className="h-4 w-10 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative w-full h-[350px] md:h-[500px] bg-slate-900 rounded-3xl overflow-hidden animate-pulse">
      <Skeleton className="w-full h-full" />
    </div>
  );
}
