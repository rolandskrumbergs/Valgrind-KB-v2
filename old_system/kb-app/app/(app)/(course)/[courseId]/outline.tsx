import { useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
  Link,
} from "expo-router";
import { Chapter, useCourseByIdQuery } from "@/features/education";
import { getChapterStatus } from "@/features/education/utils/get-chapter-status";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react-native";

const ItemSeparator = () => <View className="h-3" />;

const CourseOutlineScreen = () => {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data: course, refetch } = useCourseByIdQuery(courseId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const router = useRouter();
  const renderChapterItem = ({ item }: { item: Chapter }) => {
    const chapterStatus = getChapterStatus(item);
    const isCompleted = chapterStatus === "completed";
    return (
      <Link href={`/(course)/${courseId}/lesson/${item.chapterId}`} asChild>
        <Pressable className="border-black-100/20 w-full flex-row items-center justify-between gap-2 rounded border-[0.3px] bg-transparent px-4 py-3.5">
          <Text className="max-w-[85%] text-base text-white">{item.title}</Text>
          {isCompleted ? (
            <CheckCircle2 size={20} color="#00D9FF" />
          ) : (
            <ArrowRight size={20} color="#8899A6" />
          )}
        </Pressable>
      </Link>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-nav-bg">
      <View className="h-fit flex-row items-center justify-start gap-2 bg-nav-bg px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FAF3ED" />
        </Pressable>
        <Text className="text-2xl font-bold text-white">{course?.title}</Text>
      </View>

      <View className="relative flex-1 bg-nav-bg px-4 pt-5">
        <FlatList
          data={course?.chapters}
          renderItem={renderChapterItem}
          keyExtractor={(item) => item.chapterId}
          ItemSeparatorComponent={ItemSeparator}
        />
      </View>
    </SafeAreaView>
  );
};

export default CourseOutlineScreen;
