import React, { Suspense } from "react";

import { ManageNewsWrapper } from "@/components/news/manage-news-wrapper";
import { ManageNewsSkeleton } from "@/components/news/manage-news-skeleton";

export const dynamic = "force-dynamic";

const NewsPage = async () => {
  return (
    <Suspense fallback={<ManageNewsSkeleton />}>
      <ManageNewsWrapper />
    </Suspense>
  );
};

export default NewsPage;
