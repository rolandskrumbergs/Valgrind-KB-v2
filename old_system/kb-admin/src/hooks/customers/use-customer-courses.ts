import { useEffect, useState } from "react";
import { getCustomerCoursesByCustomerIdAction } from "@/actions/courses-actions";

export interface CustomerCourse {
  title: string;
  sharedByUserName: string | null;
  createdAt: Date;
}

export function useCustomerCourses(customerId: string) {
  const [courses, setCourses] = useState<CustomerCourse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setError(null);
      try {
        const result = await getCustomerCoursesByCustomerIdAction(customerId);
        if (result.success && result.data) {
          setCourses(result.data);
        } else {
          setError(result.error || "Failed to fetch courses");
        }
      } catch (err) {
        setError("Failed to fetch courses");
      }
      setLoading(false);
    }
    fetchCourses();
  }, [customerId]);

  return { courses, loading, error };
}
