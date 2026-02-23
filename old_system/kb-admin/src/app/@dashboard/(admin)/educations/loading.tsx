import { CoursesSkeleton } from "@/components/educations/courses-skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 h-full w-full p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your educational courses
          </p>
        </div>
        <Link href="/educations/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>
      <CoursesSkeleton />
    </div>
  );
}
