import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useCoursesQuery } from "@/features/education";
import { useCertificatesQuery } from "@/features/education/use-certificate";
import { router, useFocusEffect } from "expo-router";
import { Course, UserCourseStatus } from "@/features/education/types";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import CourseListItem from "./course-list-item";
import { useUserCoursesQuery } from "@/features/education/use-education";

interface CoursesListProps {
  courseStatus?: UserCourseStatus;
}

const CoursesList = ({ courseStatus }: CoursesListProps) => {
  const { t } = useTranslation();

  const {
    data: courses,
    isLoading: isCoursesLoading,
    error: coursesError,
    refetch: refetchCourses,
    isRefetching: isCoursesRefetching,
  } = useCoursesQuery(courseStatus);

  console.log("[CoursesList] Courses loaded:", {
    courseStatus,
    count: courses?.length ?? 0,
    courses: courses?.map((c) => ({
      courseId: c.courseId,
      title: c.title,
      status: c.status,
      userCourseStatus: c.userCourseStatus,
      completedAt: c.completedAt,
    })),
  });

  const {
    data: userInProgressCourses,
    isLoading: isUserInProgressCoursesLoading,
    error: userInProgressCoursesError,
    refetch: refetchUserInProgressCourses,
    isRefetching: isUserInProgressCoursesRefetching,
  } = useUserCoursesQuery("in_progress");

  console.log("[CoursesList] In Progress courses loaded:", {
    count: userInProgressCourses?.length ?? 0,
    courses: userInProgressCourses?.map((c) => ({
      courseId: c.courseId,
      title: c.title,
      status: c.status,
      userCourseStatus: c.userCourseStatus,
      completedAt: c.completedAt,
    })),
  });

  const {
    data: userCompletedCourses,
    isLoading: isUserCompletedCoursesLoading,
    error: userCompletedCoursesError,
    refetch: refetchUserCompletedCourses,
    isRefetching: isUserCompletedCoursesRefetching,
  } = useUserCoursesQuery("completed");

  console.log("[CoursesList] Completed courses loaded:", {
    count: userCompletedCourses?.length ?? 0,
    courses: userCompletedCourses?.map((c) => ({
      courseId: c.courseId,
      title: c.title,
      status: c.status,
      userCourseStatus: c.userCourseStatus,
      completedAt: c.completedAt,
    })),
  });

  const { data: certificates } = useCertificatesQuery();

  const refetch = useCallback(() => {
    refetchUserInProgressCourses();
    refetchUserCompletedCourses();
    refetchCourses();
  }, [
    refetchUserInProgressCourses,
    refetchUserCompletedCourses,
    refetchCourses,
  ]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: "/education/course/[courseId]",
      params: { courseId: course.courseId },
    });
  };

  // Helper function to get the actual course status for a given course
  const getActualCourseStatus = (
    course: Course
  ): UserCourseStatus | undefined => {
    // If courseStatus is provided, return it as is (user is in a filtered tab)
    if (courseStatus) {
      return courseStatus;
    }

    // Otherwise, find the course in userCourses and return its status
    const userInProgressCourse = userInProgressCourses?.find(
      (uc) => uc.courseId === course.courseId
    );

    if (userInProgressCourse) {
      return userInProgressCourse.status;
    }

    const userCompletedCourse = userCompletedCourses?.find(
      (uc) => uc.courseId === course.courseId
    );

    return userCompletedCourse?.status;
  };

  const isLoading =
    isUserCompletedCoursesLoading ||
    isUserInProgressCoursesLoading ||
    isCoursesLoading;

  if (isLoading && !courses) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-2 text-white">{t("coursesList.loading")}</Text>
      </View>
    );
  }

  const isError =
    coursesError || userInProgressCoursesError || userCompletedCoursesError;

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500">{t("coursesList.error")}</Text>
      </View>
    );
  }

  const isRefetching =
    isUserInProgressCoursesRefetching ||
    isUserCompletedCoursesRefetching ||
    isCoursesRefetching;

  return (
    <FlatList
      data={courses || []}
      renderItem={(data) => (
        <CourseListItem
          course={data.item}
          //certificates={certificates}
          courseStatus={getActualCourseStatus(data.item)}
          onPress={handleCoursePress}
        />
      )}
      keyExtractor={(item) => item.courseId}
      className="mt-2 px-2"
      ListEmptyComponent={
        !isLoading && !isError && courses?.length === 0 ? (
          <View className="mt-10 flex-1 items-center justify-center">
            <Text className="text-lg text-white">{t("coursesList.empty")}</Text>
          </View>
        ) : null
      }
      onRefresh={refetch}
      refreshing={isRefetching}
    />
  );
};

export default CoursesList;
