import { getRegularUsersAction } from "@/actions/user-actions";
import ManageRegularUsers from "./manage-regular-users";

export async function ManageRegularUsersWrapper({
  page,
}: Readonly<{ page: number }>) {
  const result = await getRegularUsersAction(page, 20);

  if ("error" in result) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">
        <div className="text-center text-destructive">{result.error}</div>
      </div>
    );
  }

  return (
    <ManageRegularUsers
      initialUsers={result.users}
      initialTotal={result.total}
      page={page}
    />
  );
}
