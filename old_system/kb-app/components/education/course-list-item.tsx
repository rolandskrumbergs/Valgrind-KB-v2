import { View, Text, Pressable, ImageBackground } from "react-native";
import {
  Course,
  //UserCompletedCourseDetails,
  UserCourseStatus,
} from "@/features/education/types";
import React from "react";
import { useTranslation } from "react-i18next";

export interface CourseItemProps {
  course: Course;
  //certificates?: UserCompletedCourseDetails[];
  courseStatus?: UserCourseStatus;
  onPress: (course: Course) => void;
}

const CourseListItem = ({
  course,
  // certificates,
  courseStatus,
  onPress,
}: CourseItemProps) => {
  const { t } = useTranslation();
  // const certificate = certificates?.find(
  //   (i) => Number(i.courseId) === Number(course.courseId)
  // );
  // const completedDate = certificate?.completedOn
  //   ? new Date(certificate.completedOn).toLocaleDateString("sv-SE", {
  //       day: "numeric",
  //       month: "short",
  //       year: "numeric",
  //     })
  //   : new Date(course.completedAt ?? "").toLocaleDateString("sv-SE", {
  //       day: "numeric",
  //       month: "short",
  //       year: "numeric",
  //     });

  const renderBadge = () => {
    if (courseStatus === "in_progress") {
      return (
        <View className="self-start rounded-full border border-primary px-3 py-0.5">
          <Text className="text-sm font-semibold text-primary">
            {t("coursesList.ongoing")}
          </Text>
        </View>
      );
    }

    if (courseStatus === "completed") {
      return (
        <View className="self-start rounded-full border border-gray-400 px-3 py-0.5">
          <Text className="text-sm font-semibold text-gray-400">
            {t("coursesList.completedOn")}
          </Text>
        </View>
      );
    }

    // not_started or no status
    return (
      <View className="self-start rounded-full border border-secondary px-3 py-0.5">
        <Text className="text-sm font-semibold text-secondary">
          {t("coursesList.doCourse")}
        </Text>
      </View>
    );
  };

  return (
    <View className="mb-3">
      <Pressable
        onPress={() => onPress(course)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          className="h-32 overflow-hidden rounded-lg bg-muted"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View
            className="flex h-full flex-row items-stretch"
            pointerEvents="none"
          >
            <ImageBackground
              source={{
                uri: course.imageUrl,
              }}
              className="h-full w-[33%]"
              resizeMode="cover"
            />
            <View className="flex-1 justify-between px-4 py-4">
              <Text className="text-lg font-bold uppercase tracking-wide text-white">
                {course.title}
              </Text>
              {renderBadge()}
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default CourseListItem;
