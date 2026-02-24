using KB.Core.Features.ConversationStarters;
using KB.Core.Features.ConversationStarters.BulkReplace;
using KB.Core.Features.ConversationStarters.GetActive;

namespace KB.Server.Endpoints.ConversationStarters;

internal static class ConversationStarterEndpoints
{
    public static IEndpointRouteBuilder MapConversationStarterEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/conversation-starters")
            .WithTags("Conversation Starters");

        group.MapGet("/", GetActiveAsync)
            .WithName("GetActiveConversationStarters")
            .RequireAuthorization()
            .Produces<List<ConversationStarterViewModel>>();

        group.MapPut("/", BulkReplaceAsync)
            .WithName("BulkReplaceConversationStarters")
            .RequireAuthorization("AdminOnly")
            .Produces<List<ConversationStarterViewModel>>()
            .ProducesValidationProblem();

        return endpoints;
    }

    private static async Task<IResult> GetActiveAsync(
        GetActiveConversationStartersQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetActiveConversationStartersQuery(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> BulkReplaceAsync(
        BulkReplaceConversationStartersRequest request,
        BulkReplaceConversationStartersCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new BulkReplaceConversationStartersCommand
        {
            Starters = request.Starters
                .Select(s => new StarterItem(s.Text, s.SortOrder, s.IsActive))
                .ToList()
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record BulkReplaceConversationStartersRequest(List<StarterItemRequest> Starters);
internal sealed record StarterItemRequest(string Text, int SortOrder, bool IsActive);
