import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Award } from "lucide-react-native";

import { ScreenContainer } from "@/components/ui/exports";
import { useUserCourseByIdQuery } from "@/features/education";

const CourseCompletionScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data: course } = useUserCourseByIdQuery(courseId);

  const hasQuestions = (course?.amountOfQuestions ?? 0) > 0;
  const hasCertificate = course?.certificateEnabled ?? false;

  const getStatusIcon = () => {
    if (!hasQuestions || course?.passed) {
      return <CheckCircle2 size={64} color="#9FAA87" />;
    }
    return <XCircle size={64} color="#E57373" />;
  };

  const getTitle = () => {
    if (!hasQuestions) {
      return t("courseCompletion.titleCompleted");
    }
    return course?.passed
      ? t("courseCompletion.titlePassed")
      : t("courseCompletion.titleFailed");
  };

  const getPassedMessage = () => {
    if (hasCertificate) {
      return (
        <>
          {t("courseCompletion.passedMessage")}
          {"\n"}
          <Text className="font-semibold text-foreground">
            {t("courseCompletion.certLink")}
          </Text>
        </>
      );
    }
    return t("courseCompletion.completedMessage");
  };

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <View className="mt-4 w-full flex-1 flex-col items-center justify-center px-6">
          {/* Title Section */}
          <View className="mb-8 w-full items-center">
            <View className="mb-4 items-center justify-center">
              {getStatusIcon()}
            </View>
            <Text className="mb-2 text-center font-rajdhani text-4xl font-semibold tracking-wide text-foreground">
              {getTitle()}
            </Text>
          </View>

          {/* Content Card */}
          <View className="w-full max-w-md rounded-2xl bg-card p-8">
            {hasQuestions ? (
              <>
                {/* Score Display */}
                <View className="mb-6 items-center">
                  <Text className="mb-2 text-center font-rajdhani text-lg text-muted-foreground">
                    {t("courseCompletion.yourScore")}
                  </Text>
                  <Text
                    className={`text-center font-rajdhani text-5xl font-bold ${
                      course?.passed ? "text-sage" : "text-destructive"
                    }`}
                  >
                    {course?.score ?? 0}%
                  </Text>
                  {hasCertificate && (
                    <Text className="mt-2 text-center font-rajdhani text-sm text-muted-foreground">
                      {t("courseCompletion.requiredScore", {
                        score: course?.requiredScore ?? 0,
                      })}
                    </Text>
                  )}
                </View>

                {/* Pass/Fail Message with Certificate Info */}
                <Text className="mb-6 text-center font-rajdhani text-base text-muted-foreground">
                  {course?.passed
                    ? getPassedMessage()
                    : t("courseCompletion.failedMessage")}
                </Text>
              </>
            ) : (
              <>
                {/* No Questions - Course Completed Message */}
                <Text className="mb-6 text-center font-rajdhani text-base text-muted-foreground">
                  {t("courseCompletion.completedMessage")}
                </Text>

                {/* Certificate Info */}
                {hasCertificate && (
                  <View className="mb-6 items-center rounded-lg bg-muted/50 p-4">
                    <Award size={32} color="#9FAA87" />
                    <Text className="mt-2 text-center font-rajdhani text-base text-muted-foreground">
                      {t("courseCompletion.certificateAvailable")}
                    </Text>
                    <Text className="mt-1 text-center font-rajdhani text-sm font-semibold text-foreground">
                      {t("courseCompletion.certLink")}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Action Button */}
            <Pressable
              onPress={() => router.replace("/(app)/education")}
              className="rounded-lg bg-primary py-4"
            >
              <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
                {t("courseCompletion.button")}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default CourseCompletionScreen;
