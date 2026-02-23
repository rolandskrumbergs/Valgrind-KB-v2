import { Skeleton } from "@/components/ui/skeleton";

export function CustomerStatsSkeleton() {
  return (
    <div className="h-full bg-muted rounded-lg p-4 flex flex-col">
      <div className="flex flex-col mb-4">
        <Skeleton className="h-6 w-24 mb-1" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-col justify-center flex-1 gap-6">
        <div className="flex flex-col items-center">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-9 w-16 mt-2" />
        </div>
        <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        <div className="flex flex-col items-center">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-9 w-16 mt-2" />
        </div>
        <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        <div className="flex flex-col items-center">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-9 w-16 mt-2" />
        </div>
        <div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        <div className="flex flex-col items-center">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-9 w-16 mt-2" />
        </div>
      </div>
    </div>
  );
}
