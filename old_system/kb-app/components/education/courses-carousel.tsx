import React from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { type Course } from "@/features/education";
import SmartImage from "@/components/ui/smart-image/smart-image";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.4; // Less than half screen width

interface CoursesCarouselProps {
  courses: Course[];
  onCoursePress?: (courseId: string) => void;
  isLoading?: boolean;
}

const CoursesCarousel = ({
  courses,
  onCoursePress,
  isLoading,
}: CoursesCarouselProps) => {
  // Show skeleton cards when loading
  if (isLoading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {[1, 2, 3].map((_, index) => (
          <View
            key={`skeleton-${index}`}
            style={{ width: CARD_WIDTH }}
            className={index === 0 ? "ml-0" : "ml-3"}
          >
            <View className="overflow-hidden rounded-xl bg-card shadow-lg">
              <View className="h-32 w-full bg-gray-700" />
              <View className="h-16 px-3 py-2.5">
                <View className="h-4 w-3/4 rounded bg-gray-700" />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  // Show empty state with same height
  if (!courses || courses.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height: 192 }}>
        <Text className="text-center text-white">No courses available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16 }}
      snapToInterval={CARD_WIDTH + 12}
      decelerationRate="fast"
    >
      {courses.map((course: Course, index: number) => (
        <Pressable
          key={course.courseId}
          onPress={() => onCoursePress?.(course.courseId)}
          style={{ width: CARD_WIDTH }}
          className={index === 0 ? "ml-0" : "ml-3"}
        >
          <View className="overflow-hidden rounded-xl bg-card shadow-lg">
            <SmartImage
              source={{ uri: course.imageUrl }}
              className="h-32 w-full"
              resizeMode="cover"
            />
            <View className="h-16 px-3 py-2.5">
              <Text
                className="text-sm font-bold uppercase text-white"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {course.title}
              </Text>
              {/* <View className="flex-row items-center gap-0.5">
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Star size={12} color="#FFD700" fill="#FFD700" />
              </View> */}
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default CoursesCarousel;
