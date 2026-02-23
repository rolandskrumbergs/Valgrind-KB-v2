import { Redirect } from "expo-router";
import { useAuth } from "@/features/auth";

export default function IndexRedirect() {
  const { isAuthenticated, isPending } = useAuth();

  if (isPending) return null;

  return <Redirect href={isAuthenticated ? "/(app)" : "/(auth)"} />;
}
