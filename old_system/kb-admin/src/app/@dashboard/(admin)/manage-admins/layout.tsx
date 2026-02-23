import {
  CheckPermissionOfUser,
  GetSessionInServer,
} from "@/actions/auth-action";
import { redirect } from "next/navigation";

interface ManageAdminsLayoutProps {
  readonly children: React.ReactNode;
}

export default async function ManageAdminsLayout({
  children,
}: ManageAdminsLayoutProps) {
  const session = await GetSessionInServer();

  if (!session?.user?.id || !session?.user?.role) {
    redirect("/");
  }

  const canCreateUser = await CheckPermissionOfUser(
    session.user.id,
    "pages",
    "admin",
  );

  if (!canCreateUser.success) {
    return (
      <div className="h-fit bg-muted rounded-lg p-4 gap-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">Unauthorized</h1>
          <p className="text-sm text-muted-foreground">
            You are not authorized to access this page
          </p>
        </div>
      </div>
    );
  }

  return <div className="flex flex-col gap-2 h-full w-full">{children}</div>;
}
