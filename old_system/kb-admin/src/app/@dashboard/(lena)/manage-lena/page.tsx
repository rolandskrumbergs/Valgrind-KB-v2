"use client";

import React from "react";

const page = () => {
	return (
		<div className="grid grid-cols-4 gap-2 h-full w-full">
			<SetStarterQuestions />
		</div>
	);
};

export default page;

const SetStarterQuestions = () => {
	return (
		<div className="h-fit w-full bg-muted rounded-lg p-4 col-span-2">
			<h1 className="text-2xl font-bold">Set Starter Questions</h1>
		</div>
	);
};
