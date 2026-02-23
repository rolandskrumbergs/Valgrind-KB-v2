"use server";

import { getChatById } from "@/db/queries/chat-queries";
import { getCustomerById } from "@/db/queries/customer-queries";
import { getNewsById } from "@/db/queries/news-queries";
import { getKnowledgeBaseFileById } from "@/db/queries/knowledgebase-queries";

type EntityType = "chat" | "customers" | "news" | "knowledge-base";

/**
 * Fetches entity name based on type and ID
 */
export async function getEntityName(entityType: EntityType, entityId: string) {
	try {
		switch (entityType) {
			case "chat": {
				const chat = await getChatById({ id: entityId });
				return { name: chat?.title || entityId };
			}

			case "customers": {
				const customer = await getCustomerById(entityId);
				return { name: customer?.name || entityId };
			}

			case "news": {
				const news = await getNewsById(entityId);
				return { name: news?.title || entityId };
			}

			case "knowledge-base": {
				const file = await getKnowledgeBaseFileById(entityId);
				return { name: file?.fileName || entityId };
			}

			default:
				return { name: entityId };
		}
	} catch (error) {
		console.error(`Error fetching ${entityType} entity details:`, error);
		return { name: entityId, error: "Failed to fetch entity details" };
	}
}
