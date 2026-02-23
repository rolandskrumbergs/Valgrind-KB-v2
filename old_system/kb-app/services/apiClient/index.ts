import axios from "axios";
import Constants from "expo-constants";

const BASE_URL = "https://kb.intressebevakaren.se/";

const appVersion = Constants.expoConfig?.version ?? "unknown";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-App-Version": appVersion,
  },
});

export default axiosInstance;
