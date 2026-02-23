import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ManageCustomersSkeleton() {
  return (
    <div className="h-full w-full bg-muted rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-start flex-col">
          <Skeleton className="h-7 w-40 mb-1" />
          <Skeleton className="h-4 w-56" />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="bg-muted-foreground/20">
          <div className="flex items-center">
            <div className="flex-1 py-4 px-4">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex-1 py-4 px-4">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1 py-4 px-4">
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center border-b last:border-0 hover:bg-muted-foreground/5"
            >
              <div className="flex-1 py-4 px-4">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="flex-1 py-4 px-4">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex-1 py-4 px-4">
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
