using KB.Core.Features.Authentication.RevokeToken;
using KB.Core.Infrastructure;
using KB.Domain.Interfaces;
using KB.Server;
using Microsoft.AspNetCore.Authorization;

namespace KB.Server.Endpoints.Auth;

internal static class RevokeTokenEndpoint
{
    public static IEndpointRouteBuilder MapRevokeToken(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/revoke", RevokeTokenAsync)
            .RequireAuthorization()
            .WithName("RevokeToken")
            .WithTags("Authentication")
            .Produces(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> RevokeTokenAsync(
        RevokeTokenRequest request,
        RevokeRefreshTokenCommandHandler handler,
        IUserContext userContext,
        CancellationToken cancellationToken)
    {
        var command = new RevokeRefreshTokenCommand
        {
            UserId = userContext.AccountObjectId,
            RefreshToken = request.RefreshToken
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record RevokeTokenRequest(string? RefreshToken);
