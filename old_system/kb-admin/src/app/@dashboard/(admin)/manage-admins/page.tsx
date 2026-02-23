import { ManageAdminWrapper } from "@/components/manage-admins/manage-admin-wrapper";
import { ManageAdminSkeleton } from "@/components/manage-admins/manage-admin-skeleton";
import { Suspense } from "react";

export default async function ManageAdminsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>;
}>) {
  const { page } = await searchParams;
  const pageNumber = Number(page) || 1;

  return (
    <Suspense fallback={<ManageAdminSkeleton />}>
      <ManageAdminWrapper page={pageNumber} />
    </Suspense>
  );
}
