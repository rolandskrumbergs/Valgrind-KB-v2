using KB.Core.Features.Authentication.RefreshToken;
using KB.Server;

namespace KB.Server.Endpoints.Auth;

internal static class RefreshTokenEndpoint
{
    public static IEndpointRouteBuilder MapRefreshToken(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/refresh", RefreshTokenAsync)
            .WithName("RefreshToken")
            .WithTags("Authentication")
            .Produces<RefreshTokenResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> RefreshTokenAsync(
        RefreshTokenRequest request,
        RefreshTokenCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new RefreshTokenCommand
        {
            RefreshToken = request.RefreshToken
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record RefreshTokenRequest(string RefreshToken);
