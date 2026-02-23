import { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSubmitAnswersMutation } from "@/features/education";
import {
  AnswerPayload,
  useUserCourseByIdQuery,
} from "@/features/education/use-education";
import VimeoWebPlayer from "@/components/ui/vimeo-web-player";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react-native";
import QuestionForm from "@/components/education/question-form";
import { Chapter } from "@/features/education/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import HtmlRenderer from "@/components/ui/html-renderer";
import { SafeAreaView } from "react-native-safe-area-context";

const LessonScreen: React.FC = () => {
  const { courseId: rawCourseId, lessonId } = useLocalSearchParams();
  const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;
  const { t } = useTranslation();
  const { mutateAsync, isPending: isSubmitting } = useSubmitAnswersMutation();
  const router = useRouter();

  const { data: course, isLoading, error } = useUserCourseByIdQuery(courseId);

  const activeChapter = useMemo<Chapter | undefined>(() => {
    if (!course?.chapters?.length) {
      return undefined;
    }
    return course.chapters.find((chapter) => chapter.chapterId == lessonId);
  }, [course, lessonId]);

  const chapterIsDone = useMemo(() => {
    return activeChapter?.questions.every(
      (q) =>
        Array.isArray(q.userAnswerOptionIds) && q.userAnswerOptionIds.length > 0
    );
  }, [activeChapter?.questions]);

  const handleNextLesson = (): void => {
    if (!course?.chapters?.length) return;

    const currentIndex = course.chapters.findIndex(
      (ch) => Number(ch.chapterId) === Number(lessonId)
    );

    if (currentIndex === -1) {
      console.log("Current chapter not found in course chapters");
      return;
    }

    const nextChapter = course.chapters[currentIndex + 1];

    if (nextChapter) {
      router.replace(`/(course)/${courseId}/lesson/${nextChapter.chapterId}`);
    } else {
      router.replace(`/(course)/${courseId}/completion`);
    }
  };

  if (isLoading || !course) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        className="flex-1 items-center justify-center bg-nav-bg"
      >
        <Text className="text-lg text-white">{t("lessonScreen.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (error || !activeChapter) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
        <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FAF3ED" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-xl text-white">
            {t("lessonScreen.notFound")}
          </Text>
          <Pressable
            className="mt-4 rounded-lg bg-primary px-6 py-4"
            onPress={() => router.push(`/(course)/${courseId}/outline`)}
          >
            <Text className="text-center font-rajdhani text-lg font-semibold text-primary-foreground">
              {t("lessonScreen.goToOutline")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleQuizSubmit = async (answers: AnswerPayload[]) => {
    await mutateAsync({ courseId, answers });
    handleNextLesson();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
      <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-white">
          {activeChapter.title}
        </Text>
      </View>

      <ScrollView className="flex-1 bg-nav-bg px-4 pb-8 pt-5">
        {activeChapter.videoUrl && (
          <View className="mb-4 overflow-hidden rounded-lg ">
            <VimeoWebPlayer videoUrl={activeChapter.videoUrl} />
          </View>
        )}

        <View className="bg-linen mb-6 rounded-lg px-4 pt-2">
          <HtmlRenderer
            html={activeChapter.description}
            tagsStylesOverride={{
              body: { fontSize: 16, color: "#FFFFFF" },
              p: { fontSize: 16, color: "#FFFFFF" },
              strong: { fontWeight: "bold", color: "#FFFFFF" },
              em: { fontStyle: "italic", color: "#FFFFFF" },
              li: { color: "#FFFFFF" },
            }}
          />
        </View>

        {activeChapter.questions && activeChapter.questions.length > 0 && (
          <QuestionForm
            questions={activeChapter.questions}
            onSubmit={handleQuizSubmit as () => Promise<void>}
            hideSubmitButton={!chapterIsDone}
            isSubmitting={isSubmitting}
          />
        )}

        {chapterIsDone && (
          <View className="px-4">
            <Pressable
              onPress={handleNextLesson}
              className="mb-16 mt-4 rounded-lg bg-primary py-4"
            >
              <View className="flex-row items-center justify-center">
                <Text className="mr-2 font-rajdhani text-lg font-semibold text-primary-foreground">
                  {t("lessonScreen.next")}
                </Text>
                <MaterialCommunityIcons name="send" size={20} color="white" />
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LessonScreen;
