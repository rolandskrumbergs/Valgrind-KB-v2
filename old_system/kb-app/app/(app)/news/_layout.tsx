import React from 'react';
import { Stack } from 'expo-router';

const _NewsLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'All News',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'News',
        }}
      />
    </Stack>
  );
};

export default _NewsLayout;
