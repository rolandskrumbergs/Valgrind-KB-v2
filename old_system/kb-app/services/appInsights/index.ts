import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactNativeManualDevicePlugin } from "@microsoft/applicationinsights-react-native";
import deviceInfo from "@/utils/deviceInfo";

// Initialize Application Insights with manual device plugin
const RNMPlugin = new ReactNativeManualDevicePlugin();
RNMPlugin.setDeviceInfoModule(deviceInfo);

export const appInsights = new ApplicationInsights({
  config: {
    connectionString:
      "InstrumentationKey=9f467870-61d8-44a4-94b3-8fcca27943c4;IngestionEndpoint=https://swedencentral-0.in.applicationinsights.azure.com/;LiveEndpoint=https://swedencentral.livediagnostics.monitor.azure.com/;ApplicationId=fa5a1587-bc24-4b59-8f99-2097db80e761",
    extensions: [RNMPlugin],
    extensionConfig: {
      [RNMPlugin.identifier]: {
        disablePageTracking: false,
      },
    },
  },
});

appInsights.loadAppInsights();
