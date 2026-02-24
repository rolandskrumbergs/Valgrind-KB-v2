using KB.Core.Features.Authentication.VerifyMfa;
using KB.Domain.Enums;
using KB.Server;

namespace KB.Server.Endpoints.Auth;

internal static class VerifyMfaEndpoint
{
    public static IEndpointRouteBuilder MapVerifyMfa(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/mfa/verify", VerifyMfaAsync)
            .WithName("VerifyMfa")
            .WithTags("Authentication")
            .Produces<bool>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoints;
    }

    private static async Task<IResult> VerifyMfaAsync(
        VerifyMfaRequest request,
        VerifyMfaCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new VerifyMfaCommand
        {
            UserId = request.UserId,
            Code = request.Code,
            MfaMethod = request.MfaMethod
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record VerifyMfaRequest(
    Guid UserId,
    string Code,
    MfaMethod MfaMethod);
