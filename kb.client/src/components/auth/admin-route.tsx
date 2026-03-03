import { useAuth } from "@/hooks/use-auth";
import { AccessDeniedPage } from "@/pages/access-denied";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== "Admin") {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
