using KB.Core.Features.Subscriptions;
using KB.Core.Features.Subscriptions.Assign;
using KB.Core.Features.Subscriptions.CreateSeats;
using KB.Core.Features.Subscriptions.Delete;
using KB.Core.Features.Subscriptions.GetByOrganization;
using KB.Core.Features.Subscriptions.Unassign;

namespace KB.Server.Endpoints.Subscriptions;

internal static class SubscriptionEndpoints
{
    public static IEndpointRouteBuilder MapSubscriptionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/organizations/{organizationId:guid}/subscriptions")
            .WithTags("Subscriptions")
            .RequireAuthorization("AdminOnly");

        group.MapPost("/", CreateSeatsAsync)
            .WithName("CreateSeats")
            .Produces<List<SubscriptionViewModel>>(StatusCodes.Status200OK)
            .ProducesValidationProblem();

        group.MapGet("/", GetByOrganizationAsync)
            .WithName("GetSubscriptionsByOrganization")
            .Produces<List<SubscriptionViewModel>>();

        group.MapPut("/{id:guid}/assign", AssignAsync)
            .WithName("AssignSubscription")
            .Produces<SubscriptionViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesValidationProblem();

        group.MapPut("/{id:guid}/unassign", UnassignAsync)
            .WithName("UnassignSubscription")
            .Produces<SubscriptionViewModel>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesValidationProblem();

        group.MapDelete("/{id:guid}", DeleteAsync)
            .WithName("DeleteSubscription")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> CreateSeatsAsync(
        Guid organizationId,
        CreateSeatsRequest request,
        CreateSeatsCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new CreateSeatsCommand
        {
            OrganizationId = organizationId,
            Count = request.Count
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetByOrganizationAsync(
        Guid organizationId,
        GetSubscriptionsByOrganizationQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetSubscriptionsByOrganizationQuery { OrganizationId = organizationId }, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> AssignAsync(
        Guid organizationId,
        Guid id,
        AssignSubscriptionRequest request,
        AssignSubscriptionCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new AssignSubscriptionCommand
        {
            OrganizationId = organizationId,
            SubscriptionId = id,
            UserId = request.UserId
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UnassignAsync(
        Guid organizationId,
        Guid id,
        UnassignSubscriptionCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new UnassignSubscriptionCommand
        {
            OrganizationId = organizationId,
            SubscriptionId = id
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteAsync(
        Guid organizationId,
        Guid id,
        DeleteSubscriptionCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new DeleteSubscriptionCommand
        {
            OrganizationId = organizationId,
            SubscriptionId = id
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record CreateSeatsRequest(int Count);
internal sealed record AssignSubscriptionRequest(Guid UserId);
