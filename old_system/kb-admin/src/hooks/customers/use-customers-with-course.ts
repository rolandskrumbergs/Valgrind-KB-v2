import { getCustomersWithCourseInfoAction } from "@/actions/customer-actions";
import { useEffect, useState } from "react";

interface CustomerWithCourse {
  customerId: string;
  name: string;
  hasCourse: boolean;
  sharedByUserId?: string | null;
  sharedAt?: Date | null;
}

export function useCustomersWithCourse(courseId?: number) {
  const [customers, setCustomers] = useState<CustomerWithCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setCustomers([]);
      return;
    }
    setLoading(true);
    setError(null);
    getCustomersWithCourseInfoAction(courseId)
      .then(
        (res: {
          success?: boolean;
          data?: CustomerWithCourse[];
          error?: string;
        }) => {
          if (res?.success && res?.data) {
            setCustomers(res?.data);
          } else {
            setError(res?.error || "Failed to fetch customers.");
          }
        },
      )
      .catch((err: Error) => {
        setError(err.message || "Unexpected error.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  return { customers, loading, error };
}
