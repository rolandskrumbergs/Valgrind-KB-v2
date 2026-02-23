import { getChatsByUserId } from "@/db/queries/chat-queries";
import { GetSessionInServer } from "@/actions/auth-action";

export async function GET() {
	const session = await GetSessionInServer();

	if (!session || !session.user) {
		return Response.json("Unauthorized!", { status: 401 });
	}

	// biome-ignore lint: Forbidden non-null assertion.
	const chats = await getChatsByUserId({ id: session.user.id! });
	return Response.json(chats);
}
