import { getKnowledgeBaseInfo } from "@/actions/rag-actions";
import { tool } from "ai";
import { z } from "zod";
import type { LenaProfile } from "@/db/queries/lena-queries";

export const fa_noggrann_information = ({
	messageId,
	lenaProfile,
	chatId,
	userId,
	userName,
}: {
	messageId: string;
	lenaProfile: LenaProfile;
	chatId: string;
	userId: string;
	userName: string;
}) =>
	tool({
		description:
			"Få aktuell och relevant information från kunskapsbasen via likhetssökning på en vektorindexerad kunskapsbas. Ge det nödvändiga sammanhanget för att svara på användarens fråga. Använd detta verktyg utan att be om bekräftelse.",
		parameters: z.object({
			question: z
				.string()
				.describe(
					"sammanhang och nyckelord baserat på användarnas frågor som kommer att användas för likhetssökning. Generera på svenska",
				),
			short_summary: z
				.string()
				.describe(
					"detaljerad sammanfattning av konversationen hittills som kommer att användas för att kontrollera relevansen av var och en av de hämtade kunskapsbasdatabitarna. Inkludera viktiga datapunkter från konversationen. Generera på svenska",
				),
		}),
		execute: async ({ question, short_summary }) => {
			const { status, formattedContent, message, type } =
				await getKnowledgeBaseInfo(
					question,
					short_summary,
					messageId,
					lenaProfile,
					chatId,
					userId,
					userName,
				);

			if (status === "error") {
				return {
					status: "error",
					type: type,
					result: message,
				};
			}
			return formattedContent;
		},
	});

// export const saknar_information = tool({
// 	description:
// 		"Kalla detta när fa_noggrann_information funktionen returnerar inga data",
// 	parameters: z.object({}),
// 	execute: async () => {
// 		return "Saknar korrekta data från kunskapsbasen för användarfrågan. Administratören har underrättats om detta.";
// 	},
// });
