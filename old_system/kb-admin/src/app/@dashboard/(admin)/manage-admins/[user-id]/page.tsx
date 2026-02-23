import React from "react";

const AdminUserPage = async ({
	params,
}: {
	params: Promise<{ user_id: string }>;
}) => {
	const user = await params;
	return (
		<div className="flex flex-col gap-2 h-fit w-full bg-muted rounded-lg p-4">
			<h1 className="text-xl font-bold">Admin User</h1>
			<p className="text-sm text-muted-foreground">User ID: {user.user_id}</p>
		</div>
	);
};

export default AdminUserPage;
