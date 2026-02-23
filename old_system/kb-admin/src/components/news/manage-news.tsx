"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Play, Plus, Search } from "lucide-react";
import { useNews } from "@/hooks/news/use-news";
import { ScrollArea } from "../ui/scroll-area";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { News } from "@/db/schema";
import { Button } from "../ui/button";
import { ResponsiveDialog } from "../responsive-dialog";
import AddNewsForm from "./add-news-form";

type SortField = "title" | "createdAt";
type SortDirection = "asc" | "desc";

interface ManageNewsProps {
  initialNews: News[];
}

const ManageNews = ({ initialNews }: ManageNewsProps) => {
  const { news, isLoading, error, mutate } = useNews(initialNews);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Reload news when dialog closes (after potentially adding a new news)
    if (!newOpen) {
      mutate();
    }
  };

  // First filter by search query
  const filteredNews = news.filter((news) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      news.title.toLowerCase().includes(query) ||
      news.content.toLowerCase().includes(query)
    );
  });

  // Then sort the filtered results
  const sortedNews = [...filteredNews].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortField === "createdAt") {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }

    if (sortDirection === "asc") {
      return (aValue as string).localeCompare(bValue as string);
    }
    return (bValue as string).localeCompare(aValue as string);
  });

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
        <div className="text-center text-destructive">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-fit w-full bg-muted rounded-lg p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Manage News</h1>
            <p className="text-sm text-muted-foreground">
              Manage news in the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                className="bg-background border border-input rounded-lg py-2 h-10 pl-10 pr-4 w-full text-sm focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder="Search news..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <ResponsiveDialog
              open={open}
              onOpenChange={handleDialogChange}
              trigger={
                <Button
                  variant="default"
                  size="default"
                  className="cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add News
                </Button>
              }
              title="New News"
              description="Add a new news to Ibben"
              className="sm:max-w-3xl"
            >
              <AddNewsForm setOpen={setOpen} />
            </ResponsiveDialog>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="grid grid-cols-5 bg-muted-foreground/20 px-3 h-12 border-b border-muted rounded-t-md items-center justify-between">
            <button
              type="button"
              onClick={() => handleSort("title")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground col-span-2 cursor-pointer"
            >
              Title
              {sortField === "title" &&
                (sortDirection === "asc" ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                ))}
            </button>
            <div className="text-muted-foreground">Status</div>
            <div className="text-muted-foreground">Created By</div>
            <button
              type="button"
              onClick={() => handleSort("createdAt")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Created At
              {sortField === "createdAt" &&
                (sortDirection === "asc" ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                ))}
            </button>
          </div>
          <ScrollArea className="max-h-[calc(100dvh-14rem)] h-full rounded-b-md ">
            <div className="bg-muted-foreground/10 divide-y divide-muted last:rounded-b-md overflow-hidden">
              {sortedNews.length === 0 ? (
                <div className="p-4 text-center">
                  {searchQuery ? "No matching news found" : "No news found"}
                </div>
              ) : (
                sortedNews.map((news) => (
                  <button
                    type="button"
                    key={news.id}
                    className="w-full text-left cursor-pointer hover:bg-muted-foreground/20 grid grid-cols-5 p-3 items-center justify-between"
                    aria-label={`View details for ${news.title}`}
                    onClick={() => router.push(`/news/${news.id}`)}
                  >
                    <div className="col-span-2">{news.title}</div>
                    <div
                      className={cn(
                        "col-span-1 rounded-full px-3 w-fit flex items-center gap-1",
                        news.status === "published"
                          ? "bg-emerald-500 text-black"
                          : "bg-muted-foreground text-black",
                      )}
                    >
                      {news.status === "published" && (
                        <Play className="w-3 h-3" fill="black" />
                      )}
                      {news.status}
                    </div>
                    <div>{news.userName}</div>
                    <div>{new Date(news.createdAt).toLocaleDateString()}</div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ManageNews;
