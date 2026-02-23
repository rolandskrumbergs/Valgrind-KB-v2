import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { openrouter } from "@openrouter/ai-sdk-provider";
export const maxDuration = 60;

export async function POST(request: Request) {
	try {
		const { text, question, short_summary } = await request.json();

		const { object, usage, response } = await generateObject({
			model: openrouter("openai/gpt-4.1-mini"),
			schema: z.object({
				reasoning: z
					.string()
					.describe("ditt resonemang innan du betygsätter textkvaliteten"),
				score: z.number().describe("ett heltalspoäng från 1 till 10"),
			}),
			prompt: `<roll>
			Analysera textavsnittet nedan och tilldela ett relevansbetyg från 1 (lågt) till 10 (högt) baserat på dess anpassning till både användarens fråga och konversationskontexten. Din utvärdering bör noggrant överväga innehållskvalitet, överensstämmelse med användarens behov och dess lämplighet för ett svenskt juridiskt, finansiellt, administrativt och i god tro rådgivande RAG-system (Advisory Retrieval Augmented Generation).
			</roll>

            <Användarfråga> ${question} </Användarfråga>

            <Konversationskontext> ${short_summary} </Konversationskontext>

            <Textutdrag> ${text} </Textutdrag>
            `,
			temperature: 0.5,
		});

		return NextResponse.json({ object, usage, response });
	} catch (error) {
		console.error("Error in LLM API:", error);
	}
}
