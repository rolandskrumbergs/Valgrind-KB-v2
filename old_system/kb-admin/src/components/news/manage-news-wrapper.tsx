import { getNewsAction } from "@/actions/news-actions";
import ManageNews from "./manage-news";

export async function ManageNewsWrapper() {
  const news = await getNewsAction();

  if ("error" in news) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
        <div className="text-center text-destructive">{news.error}</div>
      </div>
    );
  }

  return <ManageNews initialNews={news} />;
}
