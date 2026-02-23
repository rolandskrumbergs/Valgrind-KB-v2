import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCourseByIdQuery,
  useUpdateCourseStatusMutation,
} from "@/features/education";
import HtmlRenderer from "@/components/ui/html-renderer";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCoursePurchase } from "@/features/education/use-course-purchase";
import { useUserInfo } from "@/hooks/use-user-info";
import { useAuth } from "@/features/auth";
import { useUserCourseByIdQuery } from "@/features/education/use-education";

const CourseDetailScreen = () => {
  const { courseId } = useLocalSearchParams();

  let normalizedCourseId = "";
  if (typeof courseId === "string") {
    normalizedCourseId = courseId;
  } else if (Array.isArray(courseId)) {
    normalizedCourseId = courseId[0];
  }
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: isErrorLoadingCourse,
  } = useCourseByIdQuery(normalizedCourseId);

  const {
    data: userCourse,
    isLoading: isLoadingUserCourse,
    error: isErrorLoadingUserCourse,
    refetch: refetchUserCourse,
  } = useUserCourseByIdQuery(normalizedCourseId);

  const isLoading = isLoadingCourse || isLoadingUserCourse;
  const error = isErrorLoadingCourse || isErrorLoadingUserCourse;

  if (error) {
    console.error("Error fetching course:", error);
  }

  const { t } = useTranslation();
  const { session } = useAuth();

  const { mutateAsync } = useUpdateCourseStatusMutation();
  const { isPurchasing, purchase, checkAccess } = useCoursePurchase(
    courseId as string,
    "course"
  );
  const { userInfo } = useUserInfo();

  // Check access when component mounts
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Calculate if user has access to this course
  const userHasAccess = useMemo(() => {
    if (!course) {
      return false;
    }

    // If user has license, they have access to all courses
    if (session?.user?.hasLicense) {
      return true;
    }
    // If course is free, everyone has access
    if (course.price === 0) {
      return true;
    }

    // Check if user has purchased this specific course via API (useUserInfo)
    if (
      userInfo?.coursePurchases?.some(
        (p) => String(p.courseId) === String(course.courseId)
      )
    ) {
      return true;
    }

    return false;
  }, [course, session?.user?.hasLicense, userInfo?.coursePurchases]);

  const [startingCourse, setStartingCourse] = useState(false);

  const handleStartCourse = async () => {
    if (!course) {
      return;
    }

    setStartingCourse(true);

    try {
      // If user doesn't have access and course is paid, try to purchase
      if (!userHasAccess && course.price > 0) {
        const purchased = await purchase();
        if (!purchased) {
          return;
        }
        // Wait for purchase to be reflected in the backend
        await refetchUserCourse();
      }

      await mutateAsync({ courseId: Number(courseId), status: "in_progress" });

      router.push(`/(course)/${courseId}/outline`);
    } catch (error) {
      console.error("Error starting course:", error);
      Alert.alert(t("courseDetail.errorTitle"), t("courseDetail.startError"));
    } finally {
      setStartingCourse(false);
    }
  };

  const courseStatusMessage = () => {
    if (!userCourse) return null;

    const { price, status } = userCourse;
    let messageKey: string | null = null;

    if (price === 0 && status === "not_started") {
      messageKey = "courseDetail.freeAccess";
    } else if (status === "in_progress") {
      messageKey = "courseDetail.inProgress";
    } else if (status === "completed") {
      messageKey = "courseDetail.completed";
    }

    return messageKey ? (
      <Text className="text-center text-xl text-white">{t(messageKey)}</Text>
    ) : null;
  };

  const startButtonTitle = () => {
    if (!course) {
      return t("courseDetail.start");
    }

    if (!userHasAccess && course.price > 0) {
      return t("courseDetail.unlock", { price: course.price });
    }

    if (!userCourse) {
      return t("courseDetail.start");
    }

    // If user has access, show appropriate action based on course status
    switch (userCourse.status) {
      case "not_started":
        return t("courseDetail.start");
      case "in_progress":
        return t("courseDetail.continue");
      case "completed":
        return t("courseDetail.restart");
      default:
        return t("courseDetail.start");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-nav-bg p-4">
        <ActivityIndicator size="large" color="#FAFAFA" />
        <Text className="mt-4 text-center text-lg text-white">
          {t("courseDetail.loading")}
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-nav-bg p-4">
        <Text className="mb-2 text-center text-xl font-semibold text-white">
          {t("courseDetail.errorTitle")}
        </Text>
        <Text className="mb-6 text-center text-base text-white">
          {t("courseDetail.errorMessage")}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-lg bg-secondary px-6 py-3"
        >
          <Text className="text-white">{t("courseDetail.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  // Show course not found state
  if (!course) {
    return (
      <View className="flex-1 items-center justify-center bg-nav-bg p-4">
        <Text className="text-center text-white">
          {t("courseDetail.notFound")}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded bg-secondary px-4 py-2"
        >
          <Text className="text-white">{t("courseDetail.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="relative flex-1 bg-nav-bg">
      {course.imageUrl && (
        <View className="relative">
          <Image
            source={{ uri: course.imageUrl }}
            className="h-64 w-full object-cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(52, 69, 86, 0.8)", "#344556"]}
            locations={[0, 0.7, 1]}
            className="absolute bottom-0 left-0 right-0 h-32"
          />
          <Pressable
            onPress={() => router.back()}
            className="absolute left-3 top-3 z-10 rounded-full bg-black/40 p-2"
          >
            <ArrowLeft size={24} color="#FAF3ED" />
          </Pressable>
          <View className="absolute bottom-3 right-3 z-10 flex-row gap-2">
            {course.certificateEnabled && (
              <View
                className="bg-primary px-4 py-2"
                style={{ borderRadius: 9999 }}
              >
                <Text className="font-rajdhani text-base font-bold text-white">
                  {t("courseDetail.certificateAvailable")}
                </Text>
              </View>
            )}
            {course.price === 0 && (
              <View
                className="bg-primary px-4 py-2"
                style={{ borderRadius: 9999 }}
              >
                <Text className="font-rajdhani text-base font-bold text-primary-foreground">
                  {t("courseDetail.free")}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View className="flex-1 bg-nav-bg p-6 py-8">
        <Text className="mb-3 text-3xl font-extrabold text-white">
          {course.title}
        </Text>

        <View className="mb-6 mt-4">
          <HtmlRenderer
            html={course.description}
            tagsStylesOverride={{
              body: { fontSize: 16, lineHeight: 24, color: "#FAFAFA" },
              p: { marginBottom: 3, color: "#FAFAFA" },
              li: { marginBottom: 6, color: "#FAFAFA" },
              strong: { fontWeight: "bold", color: "#FAFAFA" },
              em: { fontStyle: "italic", color: "#FAFAFA" },
            }}
          />
        </View>

        {courseStatusMessage() && (
          <View className="mb-6">{courseStatusMessage()}</View>
        )}

        <Pressable
          onPress={handleStartCourse}
          disabled={isPurchasing || startingCourse}
          className="mb-6 rounded-lg bg-primary py-4"
        >
          {isPurchasing || startingCourse ? (
            <ActivityIndicator size="small" color="#FAFAFA" />
          ) : (
            <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
              {startButtonTitle()}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default CourseDetailScreen;
