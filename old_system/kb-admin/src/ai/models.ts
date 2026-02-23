export const DEFAULT_CHAT_MODEL: string = "gpt-4-5-preview";
// export const DEFAULT_CHAT_MODEL: string = "gpt-4o";

interface ChatModel {
	id: string;
	name: string;
	description: string;
}

export const chatModels: Array<ChatModel> = [
	{
		id: "gpt-4o",
		name: "GPT-4o",
		description: "Large model for complex, multi-step tasks",
	},
];
