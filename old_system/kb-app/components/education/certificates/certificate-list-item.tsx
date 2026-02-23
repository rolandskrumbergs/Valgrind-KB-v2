import { View, Text, Pressable } from "react-native";
import { Share2, Award, Download } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { UserCompletedCourseDetails } from "@/features/education/types";

interface CertificateListItemProps {
  item: UserCompletedCourseDetails;
  onShare: (courseId?: number) => void;
  onDownload: (courseId?: number, courseTitle?: string) => void;
}

const CertificateListItem: React.FC<CertificateListItemProps> = ({
  item,
  onShare,
  onDownload,
}) => {
  const { t, i18n } = useTranslation();
  // Format date to "15 januari 2025" format (localized)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNamesSv = [
      "januari",
      "februari",
      "mars",
      "april",
      "maj",
      "juni",
      "juli",
      "augusti",
      "september",
      "oktober",
      "november",
      "december",
    ];
    const monthNamesEn = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthNames = i18n.language === "sv" ? monthNamesSv : monthNamesEn;
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formattedDate = formatDate(item.completedOn.toString());

  return (
    <View className="rounded-xl bg-card p-6">
      {/* Certificate Icon */}
      <View className="mb-4 items-center">
        <View className="rounded-full bg-primary/20 p-4">
          <Award size={48} color="#5593AC" strokeWidth={2} />
        </View>
      </View>

      {/* Certificate Title */}
      <Text className="mb-3 text-center font-rajdhani text-xl font-bold uppercase tracking-wider text-white">
        {t("certificates.certificateTitle")}
      </Text>

      {/* Subtitle */}
      <Text className="mb-4 text-center font-rajdhani text-sm text-muted-foreground">
        {t("certificates.certifies")}
      </Text>

      {/* Course Title */}
      <Text className="mb-6 text-center font-rajdhani text-xl font-semibold leading-tight text-white">
        {item.title}
      </Text>

      {/* Completion Date */}
      <Text className="mb-6 text-center font-rajdhani text-sm text-muted-foreground">
        {t("certificates.completed")}: {formattedDate}
      </Text>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => onShare(item.courseId)}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary py-3"
        >
          <Share2 size={20} color="#FAFAFA" />
          <Text className="font-rajdhani text-lg font-semibold text-white">
            {t("certificates.share")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onDownload(item.courseId, item.title)}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary py-3"
        >
          <Download size={20} color="#FAFAFA" />
          <Text className="font-rajdhani text-lg font-semibold text-white">
            {t("certificates.download")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CertificateListItem;
