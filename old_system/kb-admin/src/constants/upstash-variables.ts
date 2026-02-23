interface UpstashConfig {
	url: string;
	token: string;
}

export const UPSTASH_INDICES: Record<string, UpstashConfig> = {
	books: {
		url: process.env.UPSTASH_IBBEN_KNOWLEDGE_BOOKS_INDEX_REST_URL || "",
		token: process.env.UPSTASH_IBBEN_KNOWLEDGE_BOOKS_INDEX_REST_TOKEN || "",
	},
	laws: {
		url: process.env.UPSTASH_IBBEN_KNOWLEDGE_LAWS_INDEX_REST_URL || "",
		token: process.env.UPSTASH_IBBEN_KNOWLEDGE_LAWS_INDEX_REST_TOKEN || "",
	},
	legalcases: {
		url: process.env.UPSTASH_IBBEN_KNOWLEDGE_LEGALCASES_INDEX_REST_URL || "",
		token:
			process.env.UPSTASH_IBBEN_KNOWLEDGE_LEGALCASES_INDEX_REST_TOKEN || "",
	},
	other: {
		url: process.env.UPSTASH_IBBEN_KNOWLEDGE_OTHER_INDEX_REST_URL || "",
		token: process.env.UPSTASH_IBBEN_KNOWLEDGE_OTHER_INDEX_REST_TOKEN || "",
	},
};
