import { GetSessionInServer } from "@/actions/auth-action";

export default async function DashboardPage() {
  const session = await GetSessionInServer();
  const userName = session?.user?.name || "Unknown User";

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-500 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to Ibben Admin Dashboard
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        You are logged in as <span className="font-semibold">{userName}</span>
      </p>
    </div>
  );
}
