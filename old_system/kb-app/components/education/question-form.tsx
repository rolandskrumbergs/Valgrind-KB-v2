import { useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Question } from "@/features/education/types";
import HtmlRenderer from "@/components/ui/html-renderer";

// Define the schema for a single question answer
const questionAnswerSchema = z.object({
  questionId: z.union([z.string(), z.number()]),
  selectedOptionId: z.union([z.string(), z.number()], {
    required_error: "Please select an option",
  }),
});

// Define the overall form schema
const formSchema = z.object({
  answers: z.array(questionAnswerSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface QuestionFormProps {
  questions: Question[];
  onSubmit: (
    answers: {
      questionId: string | number;
      option_id: string | number | null;
    }[]
  ) => Promise<void>;
  hideSubmitButton: boolean;
  isSubmitting?: boolean;
}

const QuestionForm = ({
  questions,
  onSubmit,
  hideSubmitButton,
  isSubmitting,
}: QuestionFormProps) => {
  const { t } = useTranslation();

  const defaultValues = {
    answers: questions.map((q) => ({
      questionId: q.questionId,
      selectedOptionId: q.userAnswerOptionIds?.[0] ?? null,
    })),
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const answers = useWatch({ control, name: "answers" });

  const initialAnswers = defaultValues.answers;

  const changedAnswers = useMemo(() => {
    if (!answers) return [];
    return answers.filter(
      (a, index) =>
        a.selectedOptionId !== initialAnswers[index]?.selectedOptionId
    );
  }, [answers, initialAnswers]);

  const isSubmitDisabled = answers?.some(
    (answer) => answer.selectedOptionId === null
  );
  const isFormChanged = changedAnswers.length > 0;

  const onSubmitHandler = async () => {
    const result = isFormChanged ? changedAnswers : initialAnswers;
    await onSubmit(
      result.map(({ questionId, selectedOptionId }) => ({
        questionId,
        option_id: selectedOptionId,
      }))
    );
  };

  return (
    <View className="flex-1 px-4">
      {questions.map((question, index) => (
        <View
          key={question.questionId}
          className="mb-6 rounded-2xl bg-card p-8"
        >
          <View className="mb-4">
            <HtmlRenderer
              html={question.text}
              tagsStylesOverride={{
                body: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
                p: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
                strong: { fontWeight: "bold", color: "#FFFFFF" },
                em: { fontStyle: "italic", color: "#FFFFFF" },
                li: { color: "#FFFFFF" },
              }}
            />
          </View>
          <Controller
            control={control}
            name={`answers.${index}.selectedOptionId`}
            render={({ field: { onChange, value } }) => (
              <View className="flex-col">
                {question.options.map((option) => {
                  const isSelected = value === option.optionId;
                  const hasAnswered = question.userAnswerOptionIds?.length > 0;
                  const isUserAnswer = question.userAnswerOptionIds?.includes(
                    option.optionId
                  );
                  const isCorrect = option.isCorrect;

                  let optionStyle = "bg-input border-border";
                  let textStyle = "text-foreground";

                  if (hasAnswered && isUserAnswer) {
                    if (isCorrect) {
                      optionStyle = "bg-green-100 border-green-500";
                      textStyle = "text-green-800 font-semibold";
                    } else {
                      optionStyle = "bg-red-100 border-red-500";
                      textStyle = "text-red-800 font-semibold";
                    }
                  } else if (isSelected) {
                    optionStyle = "bg-input border-primary";
                  }

                  let iconName:
                    | "check-circle-outline"
                    | "close-circle-outline"
                    | "circle-slice-8"
                    | "circle-outline" = "circle-outline";
                  let iconColor = "#8899A6";

                  if (hasAnswered && isUserAnswer) {
                    iconName = isCorrect
                      ? "check-circle-outline"
                      : "close-circle-outline";
                    iconColor = isCorrect ? "#16a34a" : "#dc2626";
                  } else if (!hasAnswered && isSelected) {
                    iconName = "circle-slice-8";
                    iconColor = "#5593AC";
                  }

                  return (
                    <Pressable
                      key={option.optionId}
                      className={`mb-2 min-h-14 flex-row items-start rounded-lg border px-4 py-4 ${optionStyle}`}
                      onPress={() => onChange(option.optionId)}
                      disabled={hasAnswered}
                    >
                      <MaterialCommunityIcons
                        name={iconName}
                        size={20}
                        color={iconColor}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        className={`flex-1 flex-wrap font-rajdhani text-base ${textStyle}`}
                      >
                        {option.text}
                      </Text>
                      {hasAnswered && isUserAnswer && (
                        <Text
                          className={`font-rajdhani text-sm font-semibold ${
                            isCorrect ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isCorrect
                            ? t("questionForm.correct")
                            : t("questionForm.incorrect")}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          {errors.answers?.[index]?.selectedOptionId && (
            <View className="mt-2 flex-row items-center gap-2 px-2">
              <Text className="font-rajdhani text-sm text-destructive">
                {t("questionForm.validation.selectOption")}
              </Text>
            </View>
          )}
        </View>
      ))}

      {hideSubmitButton && (
        <Pressable
          onPress={handleSubmit(onSubmitHandler)}
          className={`mb-16 mt-4 rounded-lg py-4 ${
            isSubmitDisabled || isSubmitting ? "bg-muted" : "bg-primary"
          }`}
          disabled={isSubmitDisabled || isSubmitting}
        >
          <View className="flex-row items-center justify-center">
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" className="mr-2" />
            ) : (
              <Text
                className={`mr-2 font-rajdhani text-lg font-semibold ${
                  isSubmitDisabled || isSubmitting
                    ? "text-muted-foreground"
                    : "text-primary-foreground"
                }`}
              >
                {t("questionForm.submit")}
              </Text>
            )}
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={isSubmitDisabled || isSubmitting ? "#8899A6" : "white"}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
};

export default QuestionForm;
