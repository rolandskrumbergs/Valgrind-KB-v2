using KB.Core.Features.Authentication.ChangePassword;
using KB.Domain.Interfaces;
using KB.Server;
using Microsoft.AspNetCore.Authorization;

namespace KB.Server.Endpoints.Auth;

internal static class ChangePasswordEndpoint
{
    public static IEndpointRouteBuilder MapChangePassword(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/change-password", ChangePasswordAsync)
            .RequireAuthorization()
            .WithName("ChangePassword")
            .WithTags("Authentication")
            .Produces(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoints;
    }

    private static async Task<IResult> ChangePasswordAsync(
        ChangePasswordRequest request,
        ChangePasswordCommandHandler handler,
        IUserContext userContext,
        CancellationToken cancellationToken)
    {
        var command = new ChangePasswordCommand
        {
            UserId = userContext.AccountObjectId,
            CurrentPassword = request.CurrentPassword,
            NewPassword = request.NewPassword
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);
