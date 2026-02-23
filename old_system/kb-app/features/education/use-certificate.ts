import { useQuery, QueryKey } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Platform, Alert } from "react-native";
import { useAuth } from "@/features/auth";
import apiClient from "@/services/apiClient";
import { UserCompletedCourseDetails } from "./types";
import { TFunction } from "i18next";

// Helper function to sanitize course title for filename
const sanitizeFilename = (title: string): string => {
  return title
    .replaceAll(/[^a-zA-Z0-9\s\u00C0-\u017F]/g, "") // Remove special chars, keep letters, numbers, spaces, and accented chars
    .replaceAll(/\s+/g, "-") // Replace spaces with dashes
    .replaceAll(/-+/g, "-") // Replace multiple dashes with single dash
    .trim();
};

const coursesQueryKey = (count?: number): QueryKey => ["certificate", count];

const fetchCertificates = async (
  userSessionId: string
): Promise<UserCompletedCourseDetails[]> => {
  const headers = { "User-ID": userSessionId };
  const url = `api/courses/certificate/details`;

  console.log("[Fetch Certificates] Request:", {
    url,
    headers,
  });

  try {
    const response = await apiClient(url, { headers });

    console.log("[Fetch Certificates] Response:", {
      status: response.status,
      data: response.data,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch courses: ${response.status}`);
    }

    const data = response.data;

    if (data.data && Array.isArray(data.data)) {
      // Filter to only include certificates where user is eligible
      const eligibleCertificates = data.data.filter(
        (cert: UserCompletedCourseDetails) => cert.eligibleForCertificate
      );
      console.log(
        "[Fetch Certificates] Success - Eligible certificate count:",
        eligibleCertificates.length
      );
      return eligibleCertificates;
    }
    throw new Error("Invalid response format from API");
  } catch (error) {
    console.error("[Fetch Certificates] Error:", error);
    throw error;
  }
};

export const useCertificatesQuery = () => {
  const { session } = useAuth();
  const userSessionId = session?.user?.id;

  const certificatesQuery = useQuery<UserCompletedCourseDetails[], Error>({
    queryKey: coursesQueryKey(),
    queryFn: () => fetchCertificates(userSessionId),
    enabled: !!userSessionId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: [],
  });

  const saveToAndroidStorage = async (
    cachedFileUri: string,
    filename: string,
    pdfUrl: string,
    t?: TFunction
  ) => {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      if (t) {
        Alert.alert(t("alerts.error"), t("certificates.downloadError"));
      }
      await Linking.openURL(pdfUrl);
      return;
    }

    // Read the cached file as base64
    const base64Content = await FileSystem.readAsStringAsync(cachedFileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create file in user-selected directory
    const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      filename,
      "application/pdf"
    );

    // Write content to the new file
    await FileSystem.writeAsStringAsync(newFileUri, base64Content, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (t) {
      Alert.alert(t("alerts.success"), t("certificates.downloadSuccess"));
    }
  };

  const downloadCertificatePdf = async (
    courseId?: number,
    courseTitle?: string,
    t?: TFunction
  ) => {
    if (!userSessionId) return;

    const sanitizedTitle = courseTitle
      ? sanitizeFilename(courseTitle)
      : "certificate";
    const filename = `Certificate-${sanitizedTitle}.pdf`;
    const pdfUrl = `https://kb.intressebevakaren.se/api/courses/certificate?courseId=${courseId}`;

    try {
      const cacheFileUri = FileSystem.cacheDirectory + filename;

      // Download PDF to cache first
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        cacheFileUri,
        { headers: { "User-ID": userSessionId } }
      );

      if (Platform.OS === "android") {
        await saveToAndroidStorage(downloadResult.uri, filename, pdfUrl, t);
      } else {
        // iOS: Use share sheet which includes "Save to Files" option
        await Sharing.shareAsync(downloadResult.uri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
        });
      }
    } catch (err) {
      console.error("Failed to download PDF:", err);
      if (t) {
        Alert.alert(t("alerts.error"), t("certificates.downloadError"));
      }
      // Fallback to browser
      Linking.openURL(pdfUrl).catch((error_) => {
        console.error("Failed to open PDF in browser:", error_);
      });
    }
  };

  const shareCertificatePdf = async (courseId?: number) => {
    if (!userSessionId) return null;
    try {
      const pdfUrl = `https://kb.intressebevakaren.se/api/courses/certificate?courseId=${courseId}`;
      const fileUri = FileSystem.cacheDirectory + "certificate.pdf";

      const response = await FileSystem.downloadAsync(pdfUrl, fileUri, {
        headers: { "User-ID": userSessionId },
      });

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(response.uri);
      } else {
        alert("Sharing is not available on this device");
      }

      return response.uri;
    } catch (err) {
      console.error("Failed to save PDF:", err);
      return null;
    }
  };

  return {
    ...certificatesQuery,
    downloadCertificatePdf,
    shareCertificatePdf,
  };
};
