import {
  upsertUserQuestionAnswers,
  updateUserQuestionAnswers,
  UserQuestionAnswer,
} from "@/db/queries/course-queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const answers: Pick<UserQuestionAnswer, "questionId" | "option_id">[] =
    await request.json();
  const { id: courseId } = await params;

  const response = await upsertUserQuestionAnswers(answers, userId, courseId);

  if (!response.success) {
    return Response.json(response, { status: 500 });
  }

  return Response.json(response);
}

export async function PATCH(request: Request) {
  const userId = request.headers.get("User-ID");

  if (!userId) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const answers: Pick<UserQuestionAnswer, "questionId" | "option_id">[] =
    await request.json();
  const mapped = answers.map((answer) => ({ ...answer, userId }));

  const response = await updateUserQuestionAnswers(mapped);

  if (!response.success) {
    return Response.json(response, { status: 500 });
  }

  return Response.json(response);
}
