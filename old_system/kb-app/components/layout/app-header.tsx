import React from "react";
import { View, Image } from "react-native";
import images from "@/constants/images";

const AppHeader = () => {
  return (
    <View className="h-12 w-full justify-center bg-app-header">
      <Image
        source={images.logoTextWhite}
        className="h-8 w-40"
        resizeMode="contain"
      />
    </View>
  );
};

export default AppHeader;
