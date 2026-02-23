"use client";

import Image from "next/image";
import { Plus, Loader2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCustomersWithCourse } from "@/hooks/customers/use-customers-with-course";
import { useCourses } from "@/hooks/courses/use-courses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CardHeader } from "@/components/ui/card";
import {
  deleteAdminCourseAction,
  shareCourseWithCustomerAction,
} from "@/actions/courses-actions";
import type { Course } from "@/db/queries/course-queries";

function Page() {
  const router = useRouter();

  // Use the custom hook for fetching courses
  const { courses, isLoading, error: coursesError, mutate } = useCourses();

  const [isDeleting, startDeleteTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // State for assign-to-customer modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Only call the hook when modal is open and courseToAssign is set
  const [courseToAssign, setCourseToAssign] = useState<Course | null>(null);
  const courseIdForAssign =
    isAssignModalOpen && courseToAssign?.courseId
      ? courseToAssign.courseId
      : undefined;
  const { customers, loading, error } =
    useCustomersWithCourse(courseIdForAssign);

  const [assigningCustomerId, setAssigningCustomerId] = useState<string | null>(
    null,
  );
  const [assignError, setAssignError] = useState<string | null>(null);

  const handleOpenDeleteModal = (course: Course) => {
    setCourseToDelete(course);
    setDeleteError(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    router.push(`/educations/edit/${course.courseId}`);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete?.courseId) return;

    startDeleteTransition(async () => {
      setDeleteError(null);
      // courseId is guaranteed to be defined due to the check above
      const result = await deleteAdminCourseAction(courseToDelete.courseId!);
      if (result.success) {
        // Optimistically update the cache by removing the deleted course
        mutate(
          courses.filter((c) => c.courseId !== courseToDelete.courseId),
          false,
        );
        setIsModalOpen(false);
        setCourseToDelete(null);
      } else {
        setDeleteError(result.error || "Failed to delete course.");
      }
    });
  };

  const handleShareCourse = async (customerId: string) => {
    if (!courseToAssign?.courseId) return;

    setAssigningCustomerId(customerId);
    setAssignError(null);

    const result = await shareCourseWithCustomerAction({
      customerId,
      courseId: courseToAssign.courseId,
    });

    if (result.success) {
      setAssigningCustomerId(null);
      setIsAssignModalOpen(false);
    } else {
      setAssignError(result.error || "Failed to assign course.");
      setAssigningCustomerId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg p-4 col-span-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading courses...</p>
      </div>
    );
  }

  if (coursesError) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
        <div className="text-center text-destructive">
          {coursesError.message || "An error occurred while loading courses"}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-10 flex flex-col items-center justify-center col-span-3">
        <p className="text-xl text-muted-foreground mb-4">No courses found.</p>
        <p className="text-sm text-muted-foreground mb-6">
          Get started by adding your first course!
        </p>
        {/* You can add a button here to navigate to an "add course" page */}
        {/* Example:
        <Button onClick={() => router.push('/admin/courses/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add New Course
        </Button>
        */}
      </div>
    );
  }

  return (
    <>
      <div className="h-full bg-muted rounded-lg p-10 gap-6 flex flex-col">
        <CardHeader className="px-0">
          <div className="flex justify-end items-center">
            <Button asChild variant="default" className="rounded-md">
              <Link href="/educations/create">
                <Plus className="w-4 h-4" />
                Create New Course
              </Link>
            </Button>
          </div>
        </CardHeader>
        <div className="flex flex-col w-full gap-4">
          {courses.map((course) => (
            <div
              className="flex flex-col gap-y-4 sm:flex-row p-4 border rounded-2xl justify-between items-start gap-x-2 bg-card"
              key={course.courseId}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <Image
                  src={
                    course.imageUrl ? course.imageUrl : "/image-placeholder.svg"
                  }
                  alt={`${course.title} image`}
                  width={220}
                  height={150}
                  className="w-[220px] h-[150px] object-cover self-center sm:self-start rounded-md"
                />
                <div className="flex flex-col gap-1">
                  <h2 className="font-semibold text-lg">{course.title}</h2>
                </div>
              </div>
              <div className="flex flex-col gap-y-2 justify-between items-end w-full sm:w-auto shrink-0">
                <div className="flex flex-col sm:flex-row gap-1 justify-end w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => handleEditCourse(course)}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleOpenDeleteModal(course)}
                    disabled={
                      isDeleting && courseToDelete?.courseId === course.courseId
                    }
                    className="w-full sm:w-auto"
                  >
                    {isDeleting &&
                    courseToDelete?.courseId === course.courseId ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto transition-colors hover:bg-green-100 hover:text-green-700"
                  onClick={() => {
                    setCourseToAssign(course);
                    setIsAssignModalOpen(true);
                  }}
                >
                  Share With Customer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              course titled "<strong>{courseToDelete?.title}</strong>".
              {deleteError && (
                <p className="text-sm text-destructive mt-2">{deleteError}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Assign to Customer Modal */}
      <AlertDialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="relative">
            <AlertDialogTitle>
              Share course with customers
              {isAssignModalOpen &&
                courseToAssign &&
                (loading
                  ? " Loading..."
                  : ` (${customers.filter((c) => c.hasCourse).length}/${customers.length})`)}
            </AlertDialogTitle>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-0 right-0 text-gray-400 hover:text-gray-500 cursor-pointer"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <AlertDialogDescription>
              Share "<strong>{courseToAssign?.title}</strong>" with a customer.
              <br />
              <span className="block mt-2 text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                Note: Sharing a course with a customer will also share it with
                all users of that customer who have a license and do not already
                have this course.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Customer list */}
          {isAssignModalOpen && courseToAssign
            ? (() => {
                let customerListContent: React.ReactNode;
                if (loading) {
                  customerListContent = (
                    <div className="py-4">Loading customers...</div>
                  );
                } else if (error) {
                  customerListContent = (
                    <div className="text-destructive py-4">{error}</div>
                  );
                } else if (customers.length === 0) {
                  customerListContent = (
                    <div className="py-4">No customers found.</div>
                  );
                } else {
                  customerListContent = (
                    <ul
                      className="py-2"
                      style={{ maxHeight: "320px", overflowY: "auto" }}
                    >
                      {customers.map((customer) => (
                        <li
                          key={customer.customerId}
                          className="flex items-center justify-between py-2 border-b last:border-b-0"
                        >
                          <span>{customer.name}</span>
                          {customer.hasCourse ? (
                            <span className="text-green-600 text-xs">
                              Already shared
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleShareCourse(customer.customerId)
                              }
                              disabled={
                                assigningCustomerId === customer.customerId
                              }
                            >
                              {assigningCustomerId === customer.customerId ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Share
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return customerListContent;
              })()
            : null}
          {assignError && (
            <div className="text-destructive text-sm mt-2">{assignError}</div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default Page;
