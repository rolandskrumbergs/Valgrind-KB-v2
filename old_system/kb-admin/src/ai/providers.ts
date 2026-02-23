import { customProvider } from "ai";
import { openai } from "@ai-sdk/openai";

export const myProvider = customProvider({
	languageModels: {
		"gpt-4o": openai("gpt-4o"),
		"gpt-4-turbo": openai("gpt-4-turbo"),
	},
});
