import { ManageRegularUsersWrapper } from "@/components/users/manage-regular-users-wrapper";
import { ManageRegularUsersSkeleton } from "@/components/users/manage-regular-users-skeleton";
import { Suspense } from "react";

export default async function ManageUsersPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>;
}>) {
  const { page } = await searchParams;
  const pageNumber = Number(page) || 1;

  return (
    <Suspense fallback={<ManageRegularUsersSkeleton />}>
      <ManageRegularUsersWrapper page={pageNumber} />
    </Suspense>
  );
}
