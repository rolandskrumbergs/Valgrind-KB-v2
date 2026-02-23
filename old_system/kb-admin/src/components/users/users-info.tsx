import React from "react";

const UsersInfo = () => {
	return (
		<div className="h-full bg-muted rounded-lg p-4 gap-6 flex flex-col">
			<div className="flex flex-col">
				<h1 className="text-xl font-semibold">Info</h1>
				<p className="text-sm text-muted-foreground">
					Here you can see the total number of users, the total number of
					customers, and the total number of licenses.
				</p>
			</div>
		</div>
	);
};

export default UsersInfo;
