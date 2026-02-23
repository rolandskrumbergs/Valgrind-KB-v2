import { Skeleton } from "@/components/ui/skeleton";

export function CoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 w-full h-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-muted rounded-lg border border-border overflow-hidden"
        >
          <div className="relative h-48 w-full">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
