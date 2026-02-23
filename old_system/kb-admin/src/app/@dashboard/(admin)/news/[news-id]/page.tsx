import { getNewsByIdAction } from "@/actions/news-actions";
import EditNewsForm from "@/components/news/edit-news-form";
import type { News } from "@/db/schema";
import ToggleNewsStatus from "@/components/news/toggle-news-status";
import DeleteNews from "@/components/news/delete-news";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NewsPageProps {
	params: Promise<{ "news-id": string }>;
}

const NewsPage = async ({ params }: NewsPageProps) => {
	const { "news-id": newsId } = await params;
	const news = await getNewsByIdAction(newsId);

	// Check if customer has an error
	if ("error" in news) {
		return <div className="p-4 text-red-500">Error: {news.error}</div>;
	}

	return (
		<div className="grid grid-cols-5 gap-2 h-full w-full">
			<div className="col-span-2 h-full w-full gap-2 flex flex-col">
				<NewsInfo news={news} />
				<RenderNews news={news} />
			</div>
			<div className="col-span-3 h-full w-full gap-2 flex flex-col">
				<EditNewsForm news={news} />
			</div>
		</div>
	);
};

export default NewsPage;

const NewsInfo = ({ news }: { news: News }) => {
	return (
		<div className="h-fit w-full bg-muted flex flex-col  rounded-lg  items-start justify-start">
			<div className="p-4 gap-4 flex flex-col">
				{/* <div>
					<p className="text-muted-foreground text-sm">News Title</p>
					<h2 className="text-sm font-bold">{news.title}</h2>
				</div> */}
				<div className="flex flex-row gap-4 w-fit justify-between">
					<div>
						<p className="text-muted-foreground text-sm">Created by</p>
						<h2 className="text-sm font-bold">{news.userName}</h2>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Role</p>
						<h2 className="text-sm font-bold">{news.userRole}</h2>
					</div>
				</div>
				<div className="flex flex-row gap-4 w-fit justify-between">
					<div>
						<p className="text-muted-foreground text-sm">Created at</p>
						<p className="text-sm font-bold">
							{new Date(news.createdAt).toLocaleDateString("en-US", {
								weekday: "short",
								day: "numeric",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							})}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Updated at</p>
						<p className="text-sm font-bold">
							{new Date(news.updatedAt).toLocaleDateString("en-US", {
								weekday: "short",
								day: "numeric",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							})}
						</p>
					</div>
				</div>
			</div>
			<div className="w-full h-[1px] bg-foreground/10" />
			<div className="flex flex-row gap-2 w-full justify-between p-4">
				<ToggleNewsStatus news={news} />
				<DeleteNews news={news} />
			</div>
		</div>
	);
};

const RenderNews = ({ news }: { news: News }) => {
	return (
		<div className="h-fit w-full items-center justify-center flex flex-col p-4">
			<div className="text-muted-foreground text-xs bg-muted p-2 rounded-t-lg">
				App Preview
			</div>
			<div className="flex flex-col mx-auto w-[350px] ring-4 ring-offset-0 ring-foreground/60  h-[700px]   rounded-[50px] overflow-hidden">
				<ScrollArea className="flex flex-col w-full h-[700px] justify-start">
					<div className="w-[350px] h-fit relative bg-background">
						{news.featuredImage && (
							<Image
								src={news.featuredImage}
								alt={news.title}
								width={350}
								height={350}
								className="object-contain border w-full"
							/>
						)}
						<div className="bg-gradient-to-b from-transparent to-background absolute bottom-0 left-0 right-0 h-1/3 " />
					</div>

					<div
						className={cn(
							"flex flex-col gap-1 px-4 bg-background pb-20 ",
							!news.featuredImage && "pt-10",
						)}
					>
						<p className="text-[12px] text-muted-foreground font-bold">
							{new Date(news.updatedAt).toLocaleDateString("en-US", {
								weekday: "short",
								day: "numeric",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							})}
						</p>
						<h1 className="text-md font-bold">{news.title}</h1>

						{news.pdfFiles && (
							<div className="flex flex-col gap-2  bg-background pt-2">
								<p className="text-muted-foreground text-sm">Attachments</p>
								{news.pdfFiles.map((file) => (
									<div
										key={file.s3Key}
										className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded-lg w-fit"
									>
										{file.fileName}
									</div>
								))}
							</div>
						)}
						<div
							className="text-muted-foreground text-sm pt-2"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
							dangerouslySetInnerHTML={{
								__html: news.content,
							}}
						/>
						<div className="flex flex-col gap-1 bg-background pt-2 items-end ">
							<p className="text-muted-foreground text-sm">
								Written by:{" "}
								<span className="text-foreground font-bold">
									{news.userName}
								</span>
							</p>
						</div>
					</div>
				</ScrollArea>
			</div>
		</div>
	);
};
