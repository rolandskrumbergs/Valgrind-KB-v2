import { Chat } from "@/components/chat/chat";
import React from "react";
import { generateUUID } from "@/lib/utils";

const NewChat = () => {
	const id = generateUUID();

	return <Chat key={id} id={id} initialMessages={[]} />;
};

export default NewChat;
