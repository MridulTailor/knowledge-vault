"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function GraphSkeleton() {
  return (
    <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-card p-4">
      {/* Control skeletons */}
      <div className="absolute top-4 left-4 space-y-2">
        <Skeleton className="h-16 w-24" />
      </div>

      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Main graph area */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="relative">
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <Skeleton className="h-8 w-8 rounded-full absolute top-2 left-2" />
            <Skeleton className="h-6 w-6 rounded-full absolute bottom-4 right-4" />
            <Skeleton className="h-10 w-10 rounded-full absolute top-8 right-2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="absolute bottom-4 left-4">
        <Skeleton className="h-24 w-32" />
      </div>
    </div>
  );
}
