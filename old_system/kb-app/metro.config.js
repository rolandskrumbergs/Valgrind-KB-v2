const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  extraNodeModules: {
    "react-native-device-info": path.resolve(__dirname, "utils/deviceInfo.ts"),
  },
};

module.exports = withNativeWind(config, { input: "./app/globals.css" });
