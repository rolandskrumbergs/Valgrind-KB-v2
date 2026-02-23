"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  path: string;
}

const PaginationControls = ({
  page,
  totalPages,
  path,
}: PaginationControlsProps) => {
  const router = useRouter();

  const handlePrevious = () => {
    if (page > 1) {
      router.push(`${path}?page=${page - 1}`);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      router.push(`${path}?page=${page + 1}`);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={handlePrevious}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={handleNext}
      >
        Next
      </Button>
    </div>
  );
};

export default PaginationControls;
