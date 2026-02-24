using KB.Core.Features.Authentication.Login;
using KB.Server;

namespace KB.Server.Endpoints.Auth;

internal static class LoginEndpoint
{
    public static IEndpointRouteBuilder MapLogin(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/auth/login", LoginAsync)
            .WithName("Login")
            .WithTags("Authentication")
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        LoginCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new LoginCommand
        {
            Email = request.Email,
            Password = request.Password,
            IsMobileApp = request.IsMobileApp
        };

        var result = await handler.Handle(command, cancellationToken);
        return result.ToHttpResult();
    }
}

internal sealed record LoginRequest(
    string Email,
    string Password,
    bool IsMobileApp);
