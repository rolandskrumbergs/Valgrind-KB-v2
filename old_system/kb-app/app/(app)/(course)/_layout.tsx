import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const CourseLayout = () => {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-ocean-dark">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
        }}
      >
        <Stack.Screen name="[courseId]/outline" />
        <Stack.Screen name="[courseId]/lesson/[lessonId]" />
        <Stack.Screen name="[courseId]/completion" />
      </Stack>
    </SafeAreaView>
  );
};

export default CourseLayout;
