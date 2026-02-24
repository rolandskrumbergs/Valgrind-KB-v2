using KB.Core.Features.Authentication.EnableMfa;
using KB.Domain.Enums;
using KB.Domain.Interfaces;
using KB.Server;
using Microsoft.AspNetCore.Authorization;

namespace KB.Server.Endpoints.Auth;

internal static class EnableMfaEndpoint
{
    public static IEndpointRouteBuilder MapEnableMfa(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/mfa/enable", EnableMfaAsync)
            .RequireAuthorization()
            .WithName("EnableMfa")
            .WithTags("Authentication")
            .Produces<EnableMfaResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoints;
    }

    private static async Task<IResult> EnableMfaAsync(
        EnableMfaRequest request,
        EnableMfaCommandHandler handler,
        IUserContext userContext,
        CancellationToken cancellationToken)
    {
        var command = new EnableMfaCommand
        {
            UserId = userContext.AccountObjectId,
            MfaMethod = request.MfaMethod
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record EnableMfaRequest(MfaMethod MfaMethod);
