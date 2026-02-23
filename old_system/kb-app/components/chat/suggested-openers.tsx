import type { ChatRequestOptions, CreateMessage, Message } from "ai";
import { memo } from "react";
import { Pressable, View, Text } from "react-native";
import { ArrowRight } from "lucide-react-native";

interface SuggestedActionsProps {
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ append }: Readonly<SuggestedActionsProps>) {
  const suggestedActions = [
    {
      action: "Jag är ny som god man. Vad gör jag nu?",
    },
    {
      action: "Finns det någon metod för en god man?",
    },
    {
      action: "Vilka är gode mannens gränser?",
    },
    {
      action: "Jag ska sälja min huvudmans bostad. Hur gör jag?",
    },
    {
      action:
        "Varför ska jag ansöka om merkostnadsersättning för min huvudman?",
    },
  ];

  return (
    <View className="flex flex-col gap-3">
      {suggestedActions.map((suggestedAction) => (
        <Pressable
          key={suggestedAction.action}
          onPress={async () => {
            append({
              role: "user",
              content: suggestedAction.action,
            });
          }}
          className="border-black-100/20 w-full flex-row items-center justify-between gap-2 rounded border-[0.3px] bg-transparent px-4 py-3.5"
        >
          <Text className="max-w-[90%] text-base text-white">
            {suggestedAction.action}
          </Text>
          <ArrowRight size={20} color="#8899A6" />
        </Pressable>
      ))}
    </View>
  );
}

const SuggestedActions = memo(PureSuggestedActions, () => true);

export default SuggestedActions;
