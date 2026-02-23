import { getAdminUsersAction } from "@/actions/admin-actions";
import ManageAdmin from "./manage-admin";

export async function ManageAdminWrapper({ page }: Readonly<{ page: number }>) {
  const result = await getAdminUsersAction(page, 20);

  if ("error" in result) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">
        <div className="text-center text-destructive">{result.error}</div>
      </div>
    );
  }

  return (
    <ManageAdmin
      initialUsers={result.users}
      initialTotal={result.total}
      page={page}
    />
  );
}
