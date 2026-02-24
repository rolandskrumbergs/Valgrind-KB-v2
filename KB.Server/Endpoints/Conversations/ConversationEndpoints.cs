using System.Text.Json;
using KB.Core.Features.Conversations;
using KB.Core.Features.Conversations.AddFeedback;
using KB.Core.Features.Conversations.Create;
using KB.Core.Features.Conversations.GetById;
using KB.Core.Features.Conversations.GetUserConversations;
using KB.Core.Features.Conversations.SendMessage;

namespace KB.Server.Endpoints.Conversations;

internal static class ConversationEndpoints
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static IEndpointRouteBuilder MapConversationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/conversations")
            .WithTags("Conversations")
            .RequireAuthorization();

        group.MapGet("/", GetUserConversationsAsync)
            .WithName("GetUserConversations")
            .Produces<List<ConversationViewModel>>();

        group.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetConversationById")
            .Produces<ConversationViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateAsync)
            .WithName("CreateConversation")
            .Produces<ConversationViewModel>(StatusCodes.Status200OK);

        group.MapPost("/{id:guid}/messages", SendMessageAsync)
            .WithName("SendMessage")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesValidationProblem();

        group.MapPost("/{id:guid}/messages/{messageId:guid}/feedback", AddFeedbackAsync)
            .WithName("AddFeedback")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetUserConversationsAsync(
        GetUserConversationsQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetUserConversationsQuery(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetByIdAsync(
        Guid id,
        GetConversationByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetConversationByIdQuery { Id = id }, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> CreateAsync(
        CreateConversationRequest request,
        CreateConversationCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new CreateConversationCommand
        {
            AiProfileId = request.AiProfileId,
            Title = request.Title
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task SendMessageAsync(
        Guid id,
        SendMessageRequest request,
        SendMessageCommandHandler handler,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var command = new SendMessageCommand
        {
            ConversationId = id,
            Content = request.Content
        };

        var result = await handler.Handle(command, cancellationToken);

        if (!result.IsSuccess)
        {
            httpContext.Response.StatusCode = result.Status switch
            {
                Core.Infrastructure.ResultStatus.NotFound => StatusCodes.Status404NotFound,
                Core.Infrastructure.ResultStatus.Invalid => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };
            httpContext.Response.ContentType = "application/json";
            await httpContext.Response.WriteAsJsonAsync(new { errors = result.Errors }, cancellationToken);
            return;
        }

        // SSE streaming response
        httpContext.Response.ContentType = "text/event-stream";
        httpContext.Response.Headers.CacheControl = "no-cache";
        httpContext.Response.Headers.Connection = "keep-alive";

        await foreach (var streamEvent in result.Value.WithCancellation(cancellationToken))
        {
            var json = JsonSerializer.Serialize(streamEvent, JsonOptions);
            await httpContext.Response.WriteAsync($"data: {json}\n\n", cancellationToken);
            await httpContext.Response.Body.FlushAsync(cancellationToken);
        }

        await httpContext.Response.WriteAsync("data: [DONE]\n\n", cancellationToken);
        await httpContext.Response.Body.FlushAsync(cancellationToken);
    }

    private static async Task<IResult> AddFeedbackAsync(
        Guid id,
        Guid messageId,
        AddFeedbackRequest request,
        AddFeedbackCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new AddFeedbackCommand
        {
            ConversationId = id,
            MessageId = messageId,
            IsPositive = request.IsPositive
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record CreateConversationRequest(Guid? AiProfileId, string? Title);
internal sealed record SendMessageRequest(string Content);
internal sealed record AddFeedbackRequest(bool IsPositive);
