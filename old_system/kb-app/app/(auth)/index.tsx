import {
  Image,
  ImageBackground,
  Text,
  Pressable,
  View,
  StyleSheet,
} from "react-native";
import images from "@/constants/images";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function Index() {
  const { t } = useTranslation();

  return (
    <ImageBackground
      source={images.bg2}
      className="relative h-full w-full"
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.5)"]}
        locations={[0.05, 0.5, 0.8]}
        style={styles.background}
      >
        <View className="h-fit items-center justify-center">
          <Image
            source={images.logoTextWhite}
            className="h-30 w-80"
            resizeMode="contain"
          />
        </View>
        <View className="flex w-full flex-1 flex-col items-center justify-end gap-12 pb-10">
          <View className="flex w-full flex-col items-center justify-center gap-4 px-10">
            <Text
              className="mb-2 text-center text-5xl font-bold tracking-wide text-white"
              style={{ fontWeight: "700" }}
            >
              {t("welcome.title")}
            </Text>
            <Text className="font text-center text-xl tracking-wide text-white opacity-90">
              {t("welcome.subtitle")}
            </Text>
          </View>
          <View className="mb-10 flex w-full flex-col items-center justify-center gap-4 px-10">
            <Pressable
              className="w-full rounded-lg border border-primary bg-primary py-4 shadow-sm"
              onPress={() => router.push("/sign-in")}
            >
              <Text className="text-md font-rubik-medium text-center text-white">
                {t("welcome.login")}
              </Text>
            </Pressable>

            <Pressable
              className="w-full rounded-lg border border-secondary bg-secondary py-4 shadow-sm"
              onPress={() => router.push("/sign-up")}
            >
              <Text className="text-md font-rubik-medium text-center text-foreground">
                {t("welcome.register")}
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
});
