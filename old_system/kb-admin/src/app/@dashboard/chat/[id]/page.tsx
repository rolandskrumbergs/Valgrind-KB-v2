import { notFound } from "next/navigation";
import { Chat } from "@/components/chat/chat";
import { getChatById, getMessagesByChatId } from "@/db/queries/chat-queries";
import { convertToUIMessages } from "@/lib/utils";
import { GetSessionInServer } from "@/actions/auth-action";

export default async function Page(props: { params: Promise<{ id: string }> }) {
	const params = await props.params;
	const { id } = params;
	const chat = await getChatById({ id });

	if (!chat) {
		notFound();
	}

	const session = await GetSessionInServer();

	if (!session || !session.user) {
		return notFound();
	}

	if (session.user.id !== chat.userId) {
		return notFound();
	}

	const messagesFromDb = await getMessagesByChatId({
		id,
	});

	const lastMessage = messagesFromDb[messagesFromDb.length - 1];
	const lenaProfile = lastMessage?.lenaProfile
		? lastMessage.lenaProfile
		: undefined;

	return (
		<Chat
			id={chat.id}
			initialMessages={convertToUIMessages(messagesFromDb)}
			lenaProfile={lenaProfile}
		/>
	);
}
