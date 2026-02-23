import React from "react";
import ManageUsers from "@/components/users/manage-users";
import UsersInfo from "@/components/users/users-info";

const UsersPage = async () => {
	return (
		<div className="grid grid-cols-4 gap-2 h-full w-full">
			<div className="col-span-1 h-full w-full gap-2 flex flex-col">
				<UsersInfo />
			</div>
			<ManageUsers />
		</div>
	);
};

export default UsersPage;
