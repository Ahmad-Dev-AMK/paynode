import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden bg-slate-900 border border-slate-800 h-full">
      {/* Image skeleton */}
      <div className="w-full aspect-video md:aspect-[4/3] bg-slate-800 pn-skeleton" />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-800 rounded pn-skeleton w-4/5" />
          <div className="h-4 bg-slate-800 rounded pn-skeleton w-3/5" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-1.5 flex-grow">
          <div className="h-3 bg-slate-800 rounded pn-skeleton w-full" />
          <div className="h-3 bg-slate-800 rounded pn-skeleton w-full" />
          <div className="h-3 bg-slate-800 rounded pn-skeleton w-2/3" />
        </div>

        {/* Price skeleton */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <div className="h-6 bg-slate-800 rounded pn-skeleton w-24" />
          <div className="h-4 bg-slate-800 rounded pn-skeleton w-12" />
        </div>

        {/* Buttons skeleton */}
        <div className="space-y-2 mt-1">
          <div className="h-8 bg-slate-800 rounded-lg pn-skeleton w-full" />
          <div className="h-9 bg-slate-800 rounded-lg pn-skeleton w-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
