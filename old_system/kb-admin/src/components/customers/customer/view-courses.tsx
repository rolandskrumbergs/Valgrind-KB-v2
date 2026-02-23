import { useCustomerCourses } from "@/hooks/customers/use-customer-courses";

const ViewCourses = ({ customerId }: { customerId: string }) => {
  const { courses, loading, error } = useCustomerCourses(customerId);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto shadow-md rounded-md">
        <table className="min-w-full divide-y divide-[#242424] shadow-sm">
          <thead className="bg-[#3d3d3d]">
            <tr>
              <th className="px-6 py-3 text-left text-base font-medium text-[#a1a1a1]">
                Title
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-[#a1a1a1]">
                Shared by
              </th>
              <th className="px-6 py-3 text-left text-base font-medium text-[#a1a1a1]">
                Shared at
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#303030] divide-y divide-[#242424]">
            {loading && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-center text-[#a1a1a1]"
                >
                  Loading...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            )}
            {courses &&
              courses.length > 0 &&
              courses.map((course, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-[#f7f7f7]">
                    {course.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-[#f7f7f7]">
                    {course.sharedByUserName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-[#f7f7f7]">
                    {new Date(course.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            {courses && courses.length === 0 && !loading && !error && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-center text-[#a1a1a1]"
                >
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewCourses;
