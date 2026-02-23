import { Platform } from "react-native";

// Create a simple synchronous shim for Expo
// Note: expo-device requires lazy import to avoid errors
let Device: any = null;
let Application: any = null;

try {
  Device = require("expo-device");
  Application = require("expo-application");
} catch (e) {
  console.warn("expo-device or expo-application not available");
}

export default {
  getModel: () => {
    return Device?.modelName || Device?.deviceName || Platform.OS || "Unknown";
  },
  getDeviceType: () => {
    if (!Device) return "Unknown";
    if (Device.deviceType === Device.DeviceType?.PHONE) return "Handset";
    if (Device.deviceType === Device.DeviceType?.TABLET) return "Tablet";
    if (Device.deviceType === Device.DeviceType?.DESKTOP) return "Desktop";
    if (Device.deviceType === Device.DeviceType?.TV) return "Tv";
    return "Unknown";
  },
  getUniqueId: () => {
    if (Platform.OS === "android") {
      return Application?.getAndroidId?.() || "unknown-android";
    }
    return "unknown-ios";
  },
  getUniqueIdSync: () => {
    if (Platform.OS === "android") {
      return Application?.getAndroidId?.() || "unknown-android";
    }
    return "unknown-ios";
  },
  getSystemName: () => Platform.OS,
  getSystemVersion: () => Platform.Version?.toString() || "Unknown",
  getBrand: () => Device?.brand || "Unknown",
  getManufacturer: () => Device?.manufacturer || "Unknown",
  getDeviceId: () => Device?.modelId || "Unknown",
};
