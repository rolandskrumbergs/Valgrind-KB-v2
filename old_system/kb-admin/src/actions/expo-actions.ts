import { getNewsById } from "@/db/queries/news-queries";

export async function getNewsByIdAction(id: string) {
	const news = await getNewsById(id);

	if (!news) {
		return { error: "News not found" };
	}

	return news;
}
