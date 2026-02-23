import {
	CheckPermissionOfUser,
	GetSessionInServer,
} from "@/actions/auth-action";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const LoadingState = () => (
	<div className="grid grid-cols-4 gap-2 h-full w-full">
		<div className="col-span-1 h-full w-full gap-2 flex flex-col">Loading</div>
	</div>
);

const AuthorizedContent = async ({
	children,
}: { children: React.ReactNode }) => {
	const session = await GetSessionInServer();

	if (!session?.user?.id || !session?.user?.role) {
		redirect("/");
	}

	const userHasAccess = await CheckPermissionOfUser(
		session.user.id,
		"pages",
		"lena-analytics",
	);

	if (!userHasAccess.success) {
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
	return <>{children}</>;
};

const NotificationsLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex flex-col gap-2 h-full w-full">
			<Suspense fallback={<LoadingState />}>
				<AuthorizedContent>{children}</AuthorizedContent>
			</Suspense>
		</div>
	);
};

export default NotificationsLayout;
