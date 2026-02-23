import { WebView } from "react-native-webview";
import { View, StyleSheet, Text } from "react-native";

interface VimeoWebPlayerProps {
  videoUrl: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  showTitle?: boolean;
  color?: string;
}

const VimeoWebPlayer = ({
  videoUrl,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  showTitle = false,
}: VimeoWebPlayerProps) => {
  // Build URL with parameters
  const separator = videoUrl.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    muted: muted ? "1" : "0",
    loop: loop ? "1" : "0",
    controls: controls ? "1" : "0",
    title: showTitle ? "1" : "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
    keyboard: "1",
    fullscreen: "1",
  });

  const embedUrl = `${videoUrl}${separator}${params.toString()}`;

  return (
    <View style={styles.container}>
      <WebView
        style={styles.video}
        javaScriptEnabled={true}
        allowsFullscreenVideo={true}
        source={{
          uri: embedUrl,
          headers: { Referer: "https://intressebevakaren.se" },
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("VimeoWebPlayer: WebView error occurred", {
            videoUrl,
            errorCode: nativeEvent.code,
            errorDescription: nativeEvent.description,
            errorDomain: nativeEvent.domain,
            canGoBack: nativeEvent.canGoBack,
            canGoForward: nativeEvent.canGoForward,
            loading: nativeEvent.loading,
            title: nativeEvent.title,
            url: nativeEvent.url,
          });
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("VimeoWebPlayer: HTTP error occurred", {
            videoUrl,
            httpStatusCode: nativeEvent.statusCode,
            httpDescription: nativeEvent.description,
            url: nativeEvent.url,
          });
        }}
        renderError={(errorDomain, errorCode, errorDescription) => {
          console.error("VimeoWebPlayer: Render error occurred", {
            videoUrl,
            renderErrorDomain: errorDomain,
            renderErrorCode: errorCode,
            renderErrorDescription: errorDescription,
          });
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to load video</Text>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
  },
  video: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});

export default VimeoWebPlayer;
